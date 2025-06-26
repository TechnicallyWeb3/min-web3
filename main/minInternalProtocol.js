const { pathToFileURL } = require('url')
// const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
// const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));

const { WTTPHandler } = require('@wttp/handler');
const mime = require('mime-types');

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
		scheme: 'webb',
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

		console.log('[DEBUG] Received wttp request:', req.url);
		const wttp = new WTTPHandler();
		let urlObj;
		try {
			urlObj = new URL(req.url);
		} catch (e) {
			console.error('[DEBUG] Invalid URL:', req.url, e);
			return new Response('Invalid URL', { status: 400, headers: { 'content-type': 'text/plain' } });
		}
		let contractAddress = urlObj.hostname;
		let requestedPath = urlObj.pathname || '/';

		// Normalize and sanitize the path
		let safePath = path.posix.normalize(requestedPath);
		if (safePath.startsWith('/')) safePath = safePath.slice(1);

		console.log('[DEBUG] contractAddress:', contractAddress);
		console.log('[DEBUG] requestedPath:', requestedPath);
		console.log('[DEBUG] safePath:', safePath);

		try {
			let content = "";
			let contentType = "";

			console.log('[DEBUG] Fetching from WTTPHandler:', `wttp://${contractAddress}/${safePath}`);
			const res = await wttp.fetch(`wttp://${contractAddress}/${safePath}`)
				.then(async (response) => {
					console.log('[DEBUG] WTTPHandler response status:', response.status);
					if (response.body) {
						console.log('[DEBUG] Buffer type:', typeof response.body);
						console.log('[DEBUG] Buffer length:', response.body.length);
						console.log('[DEBUG] Buffer preview (first 16 bytes):', Buffer.from(response.body).subarray(0, 16).toString('hex'));
					}

					if (response.status != 200) {
						console.log('[DEBUG] Non-200 status:', response.status, response.statusText);
						return response;
					}

					let buffer = response.body;

					contentType = mime.lookup(safePath) || '';
					if (!contentType && typeof buffer === 'string' && buffer.trim().startsWith('<!DOCTYPE html>')) {
						contentType = 'text/html; charset=utf-8';
					}
					if (contentType.startsWith('text/')) {
						contentType += '; charset=utf-8';
					}
					console.log('[DEBUG] Content Type:', contentType);

					if (typeof buffer === 'string' && buffer.startsWith('0x')) {
						buffer = Buffer.from(buffer.slice(2), 'hex');
					} else if (buffer && typeof buffer === 'object' && !Buffer.isBuffer(buffer)) {
						buffer = Buffer.from(Object.values(buffer));
					}
					if (contentType.startsWith('text/')) {
						buffer = buffer.toString('utf8');
					}
					content = buffer;
					return { content, contentType, status: response.status };
				});

			console.log('[DEBUG] Final fetch result:', {
				status: res && res.status,
				contentType: res && res.contentType,
				contentLength: res && res.content ? (typeof res.content === 'string' ? res.content.length : (res.content.length || 0)) : 0
			});

			if (res && res.content) {
				console.log('[DEBUG] Returning 200 response');
				return new Response(res.content, {
					status: 200,
					headers: { 'content-type': res.contentType }
				});
			} else if (res && res.status) {
				console.log('[DEBUG] Returning error response with status:', res.status);
				return new Response('Resource not found', {
					status: res.status,
					headers: { 'content-type': 'text/plain' }
				});
			} else {
				console.log('[DEBUG] Returning generic 404');
				return new Response('Resource not found', {
					status: 404,
					headers: { 'content-type': 'text/plain' }
				});
			}
		} catch (error) {
			console.error('[DEBUG] Error processing request:', error);
			return new Response(`[DEBUG] Error: ${error.message}`, {
				status: 500,
				headers: { 'content-type': 'text/plain' }
			});
		}
	})
}

app.on('session-created', (ses) => {
	if (ses !== session.defaultSession) {
		registerBundleProtocol(ses)
	}
})
