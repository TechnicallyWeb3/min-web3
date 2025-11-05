const { WTTPHandler } = require('@wttp/handler');
const mime = require('mime-types');

// Initialize shared WTTP handler instance
const wttp = new WTTPHandler(undefined, "polygon");

// Store current site per session (in-memory, not persistent)
const sessionCurrentSite = new Map();

// Helpers
function getErrorPage(siteAddress) {
    return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
}

function isValidEthAddress(addr) {
    return /^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(addr);
}

function isValidEnsName(addr) {
    return /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(addr);
}

function getSessionId(ses) {
    return ses && ses.id ? ses.id : 'default';
}

function getSiteAddressFromUrl(urlObj) {
    return urlObj.hostname;
}

function getFilePathFromUrl(urlObj) {
    let filePath = urlObj.pathname || '';
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    return filePath;
}

function registerWttpProtocol(ses) {
    console.log('Registering wttp protocol handler for session:', getSessionId(ses));
    
    ses.protocol.handle('wttp', async (req) => {
        console.log('WTTP protocol handler called for URL:', req.url);
        try {
            const urlObj = new URL(req.url);
            const sessionId = getSessionId(ses);

            let siteAddress;
            let filePath = getFilePathFromUrl(urlObj);

            if (urlObj.hostname === 'ca') {
                const pathParts = (urlObj.pathname || '').split('/').filter(Boolean);
                siteAddress = pathParts[0];
                filePath = pathParts.slice(1).join('/') || '';

                if (!isValidEthAddress(siteAddress) && !isValidEnsName(siteAddress)) {
                    const sessionSite = sessionCurrentSite.get(sessionId);
                    if (sessionSite) {
                        siteAddress = sessionSite;
                        filePath = pathParts.join('/');
                    }
                } else {
                    sessionCurrentSite.set(sessionId, siteAddress);
                }
            } else {
                siteAddress = getSiteAddressFromUrl(urlObj);
            }

            if (
                (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) &&
                (!filePath || filePath === '' || filePath === 'index.html') &&
                !req.url.endsWith('/')
            ) {
                let redirectUrl = req.url + '/';
                redirectUrl = redirectUrl.replace(/([^:])\/\//g, '$1/');
                return new Response('', {
                    status: 301,
                    headers: { 'Location': redirectUrl }
                });
            }

            if (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) {
                sessionCurrentSite.set(sessionId, siteAddress);
                if (!filePath || filePath === '') filePath = 'index.html';

                const wttpUrl = `wttp://${siteAddress}/${filePath}`;
                
                // Parse HTTP range request headers
                const range = req.headers.get('range');
                const rangeBytes = range ? (() => {
                    const parts = range.split('=');
                    if (parts.length === 2 && parts[0].trim() === 'bytes') {
                        const byteRange = parts[1].trim();
                        const rangeParts = byteRange.split('-');
                        return {
                            start: rangeParts[0] ? rangeParts[0].trim() : undefined,
                            end: rangeParts[1] ? rangeParts[1].trim() : undefined
                        };
                    }
                    return undefined;
                })() : undefined;
                
                const wttpResult = await wttp.fetch(wttpUrl, {
                    ifModifiedSince: req.headers.get('if-modified-since'),
                    ifNoneMatch: req.headers.get('if-none-match'),
                    rangeBytes: rangeBytes
                });

                if (!wttpResult || typeof wttpResult !== 'object') {
                    return new Response('Internal WTTP Protocol Error (invalid response)', {
                        status: 500,
                        headers: { 'content-type': 'text/plain' }
                    });
                }

                console.log('WTTP handler success, response status:', wttpResult.status);

                const headers = new Headers(wttpResult.headers);
                let detectedContentType = headers.get('content-type') || headers.get('Content-Type') || '';
                if (!detectedContentType) {
                    const ext = (filePath || '').split('.').pop()?.toLowerCase();
                    const inferred = mime.lookup(ext || '') || (filePath === '' || filePath === 'index' || filePath === 'index.html' ? 'text/html' : '');
                    if (inferred) {
                        headers.set('content-type', inferred);
                        detectedContentType = inferred;
                    }
                }

                let body = wttpResult.body;
                if ((detectedContentType || '').includes('text/html')) {
                    try {
                        const htmlText = typeof body === 'string' ? body : await new Response(body).text();
                        const baseUrl = `wttp://ca/${siteAddress}/`;
                        const baseTag = `<base href="${baseUrl}">`;
                        let modifiedHtml = htmlText;
                        if (htmlText.includes('<head>')) {
                            if (!htmlText.includes('<base')) {
                                modifiedHtml = htmlText.replace('<head>', `<head>${baseTag}`);
                            }
                        } else if (htmlText.includes('<html>')) {
                            modifiedHtml = htmlText.replace('<html>', `<html><head>${baseTag}</head>`);
                        } else {
                            modifiedHtml = `<head>${baseTag}</head>${htmlText}`;
                        }
                        body = modifiedHtml;
                    } catch (e) {}
                }

                const response = new Response(body, {
                    status: wttpResult.status,
                    headers
                });

                if (response.status !== 200) {
                    let status = 404;
                    let contentType = 'text/html';
                    let errorHtml = getErrorPage(siteAddress);
                    if (response.status >= 500) {
                        status = 500;
                        errorHtml = `<html><body><h1>WTTP Error</h1><pre>${response.statusText || 'Unknown error'}</pre></body></html>`;
                    }
                    return new Response(errorHtml, {
                        status,
                        headers: { 'content-type': contentType }
                    });
                }

                return response;
            }

            const originalSite = sessionCurrentSite.get(sessionId) || 'wordl3.eth';
            let fullPath = urlObj.pathname;
            if (fullPath.startsWith('/')) fullPath = fullPath.slice(1);
            const wttpUrl = `wttp://${originalSite}/${fullPath}`;
            
            // Parse HTTP range request headers
            const range = req.headers.get('range');
            const rangeBytes = range ? (() => {
                const parts = range.split('=');
                if (parts.length === 2 && parts[0].trim() === 'bytes') {
                    const byteRange = parts[1].trim();
                    const rangeParts = byteRange.split('-');
                    return {
                        start: rangeParts[0] ? rangeParts[0].trim() : undefined,
                        end: rangeParts[1] ? rangeParts[1].trim() : undefined
                    };
                }
                return undefined;
            })() : undefined;
            
            const wttpResult = await wttp.fetch(wttpUrl, {
                ifModifiedSince: req.headers.get('if-modified-since'),
                ifNoneMatch: req.headers.get('if-none-match'),
                rangeBytes: rangeBytes
            });

            if (!wttpResult || typeof wttpResult !== 'object') {
                return new Response('Internal WTTP Protocol Error (invalid response)', {
                    status: 500,
                    headers: { 'content-type': 'text/plain' }
                });
            }

            const headers = new Headers(wttpResult.headers);
            let detectedContentType = headers.get('content-type') || headers.get('Content-Type') || '';
            if (!detectedContentType) {
                const ext = (fullPath || '').split('.').pop()?.toLowerCase();
                const inferred = mime.lookup(ext || '') || (fullPath === '' || fullPath === 'index' || fullPath === 'index.html' ? 'text/html' : '');
                if (inferred) {
                    headers.set('content-type', inferred);
                    detectedContentType = inferred;
                }
            }

            let body = wttpResult.body;
            if ((detectedContentType || '').includes('text/html')) {
                try {
                    const htmlText = typeof body === 'string' ? body : await new Response(body).text();
                    const baseUrl = `wttp://ca/${originalSite}/`;
                    const baseTag = `<base href="${baseUrl}">`;
                    let modifiedHtml = htmlText;
                    if (htmlText.includes('<head>')) {
                        if (!htmlText.includes('<base')) {
                            modifiedHtml = htmlText.replace('<head>', `<head>${baseTag}`);
                        }
                    } else if (htmlText.includes('<html>')) {
                        modifiedHtml = htmlText.replace('<html>', `<html><head>${baseTag}</head>`);
                    } else {
                        modifiedHtml = `<head>${baseTag}</head>${htmlText}`;
                    }
                    body = modifiedHtml;
                } catch (e) {}
            }

            const response = new Response(body, {
                status: wttpResult.status,
                headers
            });

            if (response.status !== 200) {
                let status = 404;
                let contentType = 'text/html';
                let errorHtml = getErrorPage(originalSite);
                if (response.status >= 500) {
                    status = 500;
                    errorHtml = `<html><body><h1>WTTP Error</h1><pre>${response.statusText || 'Unknown error'}</pre></body></html>`;
                }
                return new Response(errorHtml, {
                    status,
                    headers: { 'content-type': contentType }
                });
            }

            return response;
        } catch (error) {
            console.error('WTTP handler error:', error);
            return new Response(`Error: ${error.message}`, {
                status: 500,
                headers: { 'content-type': 'text/plain' }
            });
        }
    });
}

module.exports = { registerWttpProtocol };


