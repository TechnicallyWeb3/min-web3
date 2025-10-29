const { pathToFileURL } = require('url')

const { WTTPHandler } = require('@wttp/handler');
const mime = require('mime-types');
// const { handleWttpRequest } = require('./wttpHandler.js');

// Store current site per session (in-memory, not persistent)
const sessionCurrentSite = new Map();

// Helper: Return a simple HTML error page
function getErrorPage(siteAddress) {
	return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
}

// Helper: Validate Ethereum address
function isValidEthAddress(addr) {
	return /^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(addr);
}
// Helper: Validate ENS name
function isValidEnsName(addr) {
	return /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(addr);
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

protocol.registerSchemesAsPrivileged([
	{
		scheme: 'min',
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
		}
	},
	{
		scheme: 'web3',
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true
		}
	},
	{
		scheme: 'wttp',
		privileges: {
			standard: false,
			secure: true,
			allowServiceWorkers: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true,
			bypassCSP: false
		}
	}
])



function registerBundleProtocol(ses) {
	ses.protocol.handle('min', (req) => {

		console.log('Debug: Received min request:', req.url);
		let { host, pathname } = new URL(req.url)

		if (pathname.charAt(0) === '/') {
			pathname = pathname.substring(1)
		}

		if (host !== 'app') {
			return new Response('bad', {
				status: 400,
				headers: { 'content-type': 'text/html' }
			})
		}

		// NB, this checks for paths that escape the bundle, e.g.
		// app://bundle/../../secret_file.txt
		const pathToServe = path.resolve(__dirname, pathname)
		const relativePath = path.relative(__dirname, pathToServe)
		const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)

		if (!isSafe) {
			return new Response('bad', {
				status: 400,
				headers: { 'content-type': 'text/html' }
			})
		}

		return net.fetch(pathToFileURL(pathToServe).toString())
	})

	ses.protocol.handle('wttp', async (req) => {
		try {
			const urlObj = new URL(req.url);
			const sessionId = getSessionId(ses);

			console.log('[DEBUG] Processing WTTP URL:', req.url, 'hostname:', urlObj.hostname, 'pathname:', urlObj.pathname);

			let siteAddress;
			let filePath = getFilePathFromUrl(urlObj);

			if (urlObj.hostname === 'ca') {
				// Extract address from the first segment of the path
				const pathParts = (urlObj.pathname || '').split('/').filter(Boolean);
				siteAddress = pathParts[0];
				// Remove the address from the filePath
				filePath = pathParts.slice(1).join('/') || '';
				console.log('[DEBUG] CA prefix detected - siteAddress:', siteAddress, 'filePath:', filePath);
				
				// Check if this is a malformed URL (relative path resolved against ca/ prefix)
				// If siteAddress doesn't look like an ETH address or ENS name, treat as relative path
				if (!isValidEthAddress(siteAddress) && !isValidEnsName(siteAddress)) {
					console.log('[DEBUG] Malformed URL detected, treating as relative path');
					const sessionSite = sessionCurrentSite.get(sessionId);
					console.log('[DEBUG] Session ID:', sessionId, 'Session site:', sessionSite);
					if (sessionSite) {
						siteAddress = sessionSite;
						filePath = pathParts.join('/'); // Use the full path as filePath
						console.log('[DEBUG] Corrected to session site:', siteAddress, 'filePath:', filePath);
					} else {
						console.log('[DEBUG] No session site found, using default');
					}
				} else {
					// This is a valid ETH/ENS address in ca/ format, but we need to ensure
					// the session is updated to track this as the current site
					sessionCurrentSite.set(sessionId, siteAddress);
					console.log('[DEBUG] Updated session site for valid address:', sessionId, '->', siteAddress);
				}
			} else {
				siteAddress = getSiteAddressFromUrl(urlObj);
				console.log('[DEBUG] Direct address - siteAddress:', siteAddress, 'filePath:', filePath);
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
				console.log('[DEBUG] Valid ETH/ENS address detected, taking first path');
				// Store the current site for session tracking
				sessionCurrentSite.set(sessionId, siteAddress);
				console.log('[DEBUG] Stored session site:', sessionId, '->', siteAddress);
				// If no file path, default to index.html
				if (!filePath || filePath === '') filePath = 'index.html';

				const wttpUrl = `wttp://${siteAddress}/${filePath}`;
				console.log('[DEBUG] Fetching WTTP URL:', wttpUrl);
				const wttpResult = await (new WTTPHandler(undefined, "polygon")).fetch(wttpUrl);
				console.log('[DEBUG] WTTP fetch response:', wttpResult, 'Type:', typeof wttpResult);

				if (!wttpResult || typeof wttpResult !== 'object') {
					console.error('[WTTP PROTOCOL ERROR] Invalid response object from WTTPHandler');
					return new Response('Internal WTTP Protocol Error (invalid response)', {
						status: 500,
						headers: { 'content-type': 'text/plain' }
					});
				}

			const headers = new Headers(wttpResult.headers);
			
			// If missing, infer content-type from the requested filePath
			let detectedContentType = headers.get('content-type') || headers.get('Content-Type') || '';
			if (!detectedContentType) {
				const ext = (filePath || '').split('.').pop()?.toLowerCase();
				const inferred = mime.lookup(ext || '') || (filePath === '' || filePath === 'index' || filePath === 'index.html' ? 'text/html' : '');
				if (inferred) {
					headers.set('content-type', inferred);
					detectedContentType = inferred;
				}
			}
			
			// If this is HTML content, inject a base tag to fix relative URLs
			let body = wttpResult.body;
			if ((detectedContentType || '').includes('text/html')) {
				try {
					const htmlText = typeof body === 'string' ? body : await new Response(body).text();
					// Inject base tag with the pretty URL (without ca/ prefix)
					const baseUrl = `wttp://${siteAddress}/`;
					const baseTag = `<base href="${baseUrl}">`;
					console.log('[DEBUG] Injecting base tag for siteAddress:', siteAddress, 'baseUrl:', baseUrl);
					
					// Insert base tag after <head> or at the beginning if no head tag
					let modifiedHtml = htmlText;
					if (htmlText.includes('<head>')) {
						// Check if base tag already exists
						if (!htmlText.includes('<base')) {
							modifiedHtml = htmlText.replace('<head>', `<head>${baseTag}`);
						}
					} else if (htmlText.includes('<html>')) {
						modifiedHtml = htmlText.replace('<html>', `<html><head>${baseTag}</head>`);
					} else {
						modifiedHtml = `<head>${baseTag}</head>${htmlText}`;
					}
					
					body = modifiedHtml;
				} catch (e) {
					console.error('[WTTP] Error injecting base tag:', e);
				}
			}
			
			const response = new Response(body, {
				status: wttpResult.status,
				headers
			});

			if (response.status !== 200) {
				// Show a custom error page for contract/internal errors
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

			// Return the response directly for successful fetches
			return response;
			}

			// If not a valid site address, treat as a relative path
			console.log('[DEBUG] Not a valid ETH/ENS address, taking second path');
			const originalSite = sessionCurrentSite.get(sessionId) || 'wordl3.eth';
			let fullPath = urlObj.pathname;
			if (fullPath.startsWith('/')) fullPath = fullPath.slice(1);
			const wttpUrl = `wttp://${originalSite}/${fullPath}`;
			console.log('[DEBUG] Second path - originalSite:', originalSite, 'fullPath:', fullPath, 'wttpUrl:', wttpUrl);
			const wttpResult = await (new WTTPHandler()).fetch(wttpUrl);
			console.log('[DEBUG] WTTP fetch response:', wttpResult, 'Type:', typeof wttpResult);

			if (!wttpResult || typeof wttpResult !== 'object') {
				console.error('[WTTP PROTOCOL ERROR] Invalid response object from WTTPHandler');
				return new Response('Internal WTTP Protocol Error (invalid response)', {
					status: 500,
					headers: { 'content-type': 'text/plain' }
				});
			}

			const headers = new Headers(wttpResult.headers);
			
			// If missing, infer content-type from the requested path
			let detectedContentType = headers.get('content-type') || headers.get('Content-Type') || '';
			if (!detectedContentType) {
				const ext = (fullPath || '').split('.').pop()?.toLowerCase();
				const inferred = mime.lookup(ext || '') || (fullPath === '' || fullPath === 'index' || fullPath === 'index.html' ? 'text/html' : '');
				if (inferred) {
					headers.set('content-type', inferred);
					detectedContentType = inferred;
				}
			}
			
			// If this is HTML content, inject a base tag to fix relative URLs
			let body = wttpResult.body;
			if ((detectedContentType || '').includes('text/html')) {
				try {
					const htmlText = typeof body === 'string' ? body : await new Response(body).text();
					// Inject base tag with the pretty URL (without ca/ prefix)
					const baseUrl = `wttp://${originalSite}/`;
					const baseTag = `<base href="${baseUrl}">`;
					console.log('[DEBUG] Injecting base tag for originalSite:', originalSite, 'baseUrl:', baseUrl);
					
					// Insert base tag after <head> or at the beginning if no head tag
					let modifiedHtml = htmlText;
					if (htmlText.includes('<head>')) {
						// Check if base tag already exists
						if (!htmlText.includes('<base')) {
							modifiedHtml = htmlText.replace('<head>', `<head>${baseTag}`);
						}
					} else if (htmlText.includes('<html>')) {
						modifiedHtml = htmlText.replace('<html>', `<html><head>${baseTag}</head>`);
					} else {
						modifiedHtml = `<head>${baseTag}</head>${htmlText}`;
					}
					
					body = modifiedHtml;
				} catch (e) {
					console.error('[WTTP] Error injecting base tag:', e);
				}
			}
			
			const response = new Response(body, {
				status: wttpResult.status,
				headers
			});

			if (response.status !== 200) {
				// Show a custom error page for contract/internal errors
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

			// Return the response directly for successful fetches
			return response;
		} catch (err) {
			console.error('[WTTP PROTOCOL ERROR]', err);
			return new Response('Internal WTTP Protocol Error', {
				status: 500,
				headers: { 'content-type': 'text/plain' }
			});
		}
	});
}

app.on('session-created', (ses) => {
	if (ses !== session.defaultSession) {
		registerBundleProtocol(ses)
	}
})


