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
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true
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
				const response = new Response(wttpResult.body, {
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
			const originalSite = sessionCurrentSite.get(sessionId) || 'wordl3.eth';
			let fullPath = urlObj.pathname;
			if (fullPath.startsWith('/')) fullPath = fullPath.slice(1);
			const wttpUrl = `wttp://${originalSite}/${fullPath}`;
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
			const response = new Response(wttpResult.body, {
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


