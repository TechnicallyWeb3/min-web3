const { WTTPHandler } = require('@wttp/handler');
const mime = require('mime-types');

// Helper: Return a simple HTML error page
function getErrorPage(siteAddress) {
    return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
}

// Helper: Validate Ethereum address
function isValidEthAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
// Helper: Validate ENS name
function isValidEnsName(addr) {
    return /\.eth$/.test(addr);
}
// Helper: Get session ID
function getSessionId(ses) {
    return ses && ses.id ? ses.id : 'default';
}
// Helper: Get site address from URL object
function getSiteAddressFromUrl(urlObj) {
    return urlObj.hostname;
}
// Helper: Get file path from URL object
function getFilePathFromUrl(urlObj) {
    let filePath = urlObj.pathname || '';
    if (filePath.startsWith('/')) filePath = filePath.slice(1);
    return filePath;
}

// Main WTTP request handler
async function handleWttpRequest(req, ses) {
    try {
        const urlObj = new URL(req.url);
        const sessionId = getSessionId(ses);

        // Extract contract address and file path correctly for internal WTTP URLs
        let siteAddress;
        let filePath = getFilePathFromUrl(urlObj);

        if (urlObj.hostname === 'ca') {
            // Extract address from the first segment of the path
            const pathParts = (urlObj.pathname || '').split('/').filter(Boolean);
            siteAddress = pathParts[0];
            // Remove the address from the filePath
            filePath = pathParts.slice(1).join('/') || '';
        } else {
            siteAddress = getSiteAddressFromUrl(urlObj);
        }

        // REDIRECT: If root directory request without trailing slash, redirect to slash version
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

        // If the hostname is a valid ETH/ENS, treat as root or file request
        if (isValidEthAddress(siteAddress) || isValidEnsName(siteAddress)) {
            // If no file path, default to index.html
            if (!filePath || filePath === '') filePath = 'index.html';

            const wttpUrl = `wttp://${siteAddress}/${filePath}`;
            const result = await handleWttpFetch(wttpUrl, filePath);

            if (result.status !== 200) {
                // Show a custom error page for contract/internal errors
                let status = 404;
                let contentType = 'text/html';
                let errorHtml = getErrorPage(siteAddress);
                if (result.errorType === 'revert' || result.errorType === 'internal') {
                    status = 500;
                    errorHtml = `<html><body><h1>WTTP Error</h1><pre>${result.errorMessage || 'Unknown error'}</pre></body></html>`;
                }
                return new Response(errorHtml, {
                    status,
                    headers: { 'content-type': contentType }
                });
            }

            let responseBody = result.buffer;
            if (result.contentType && result.contentType.startsWith('text/') && Buffer.isBuffer(responseBody)) {
                responseBody = responseBody.toString('utf8');
            }
            return new Response(responseBody, {
                status: 200,
                headers: {
                    'content-type': result.contentType,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        }

        // If not a valid site address, treat as a relative path
        // (sessionCurrentSite logic can be added here if needed)
        // For now, fallback to 404
        return new Response(getErrorPage(siteAddress), {
            status: 404,
            headers: { 'content-type': 'text/html' }
        });
    } catch (err) {
        console.error('[WTTP PROTOCOL ERROR]', err);
        return new Response('Internal WTTP Protocol Error', {
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    }
}

// Helper: Fetch WTTP content
async function handleWttpFetch(wttpUrl, filePath) {
    const wttp = new WTTPHandler();
    try {
        const response = await wttp.fetch(wttpUrl);

        if (response.status !== 200) {
            // Try to distinguish not found vs. other errors
            let errorType = 'notfound';
            let errorMessage = response.statusText || 'Not found';
            if (response.status >= 500) {
                errorType = 'internal';
                errorMessage = response.statusText || 'Internal error';
            }
            return {
                status: response.status,
                errorType,
                errorMessage,
                contentType: 'text/plain',
                buffer: Buffer.from(`WTTP Error: ${errorMessage}`)
            };
        }

        // Robust Content-Type detection
        let contentType = null;
        if (response.headers && response.headers.get) {
            contentType = response.headers.get('content-type') || response.headers.get('Content-Type');
        } else if (response.headers && response.headers['content-type']) {
            contentType = response.headers['content-type'] || response.headers['Content-Type'];
        }
        if (!contentType && response.headers && response.headers[Symbol.for('headers map')]) {
            const headersMap = response.headers[Symbol.for('headers map')];
            const contentTypeHeader = headersMap.get('content-type');
            if (contentTypeHeader && contentTypeHeader.value) {
                contentType = contentTypeHeader.value;
            }
        }
        if (!contentType) {
            const extension = filePath ? filePath.split('.').pop()?.toLowerCase() : '';
            contentType = mime.lookup(extension) || 'application/octet-stream';
        }
        if (contentType && contentType.includes('charset=')) {
            const parts = contentType.split(';');
            const mainType = parts[0].trim();
            const charsetPart = parts.find(part => part.trim().startsWith('charset='));
            const charsetValue = charsetPart ? charsetPart.split('=')[1]?.trim() : '';
            if (charsetValue) {
                contentType = `${mainType}; charset=${charsetValue}`;
            } else {
                contentType = mainType.startsWith('text/') ? `${mainType}; charset=utf-8` : mainType;
            }
        } else if (contentType && contentType.startsWith('text/') && !contentType.includes('charset=')) {
            contentType = `${contentType}; charset=utf-8`;
        }
        if (!contentType) {
            contentType = 'text/html; charset=utf-8';
        }
        let buffer;
        if (response.body && typeof response.body[Symbol.asyncIterator] === 'function') {
            const chunks = [];
            for await (const chunk of response.body) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            buffer = Buffer.concat(chunks);
            if (contentType && contentType.startsWith('text/')) {
                const text = buffer.toString('utf8');
                buffer = text;
            }
        } else {
            if (contentType && contentType.startsWith('text/')) {
                if (typeof response.body === 'string') {
                    buffer = response.body;
                } else if (Buffer.isBuffer(response.body)) {
                    buffer = response.body.toString('utf8');
                } else if (Array.isArray(response.body)) {
                    buffer = Buffer.from(response.body).toString('utf8');
                } else if (response.body instanceof Uint8Array) {
                    buffer = Buffer.from(response.body).toString('utf8');
                } else {
                    buffer = '';
                }
            } else {
                if (Buffer.isBuffer(response.body)) {
                    buffer = response.body;
                } else if (Array.isArray(response.body)) {
                    buffer = Buffer.from(response.body);
                } else if (typeof response.body === 'string') {
                    buffer = Buffer.from(response.body, 'utf8');
                } else if (response.body instanceof Uint8Array) {
                    buffer = Buffer.from(response.body);
                } else {
                    buffer = Buffer.from([]);
                }
            }
        }
        return {
            status: response.status,
            contentType,
            buffer: buffer
        };
    } catch (err) {
        // Classify error
        let errorType = 'internal';
        let errorMessage = err.shortMessage || err.message || String(err);
        if (err.code === 'CALL_EXCEPTION' || errorMessage.includes('execution reverted')) {
            errorType = 'revert';
        }
        console.error('[WTTP FETCH ERROR]', err);
        return {
            status: 500,
            errorType,
            errorMessage,
            contentType: 'text/html',
            buffer: Buffer.from(`<html><body><h1>WTTP Error</h1><pre>${errorMessage}</pre></body></html>`, 'utf8')
        };
    }
}

module.exports = {
    handleWttpRequest
}; 