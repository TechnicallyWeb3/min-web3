const { pathToFileURL } = require('url')

// const { WTTPHandler } = require('@wttp/handler');
// const mime = require('mime-types');
// Note: registerWttpProtocol is defined in wttpHandler.js which comes before this file in the build bundle
// No need to require it since files are concatenated together
// const { handleWttpRequest } = require('./wttpHandler.js');

// Store current site per session (in-memory, not persistent)
// const sessionCurrentSite = new Map();

// Helper: Return a simple HTML error page
// function getErrorPage(siteAddress) {
// 	return `<html><body><h1>404 Not Found</h1><p>Site: ${siteAddress}</p></body></html>`;
// }

// Helper: Validate Ethereum address
// function isValidEthAddress(addr) {
// 	return /^0x[a-fA-F0-9]{40}(:[a-zA-Z0-9_-]+)?$/.test(addr);
// }
// Helper: Validate ENS name
// function isValidEnsName(addr) {
// 	return /^.+\.eth(:[a-zA-Z0-9_-]+)?$/.test(addr);
// }
// Helper: Get session ID
// function getSessionId(ses) {
// 	return ses && ses.id ? ses.id : 'default';
// }
// Helper: Get site address from URL object
// function getSiteAddressFromUrl(urlObj) {
// 	return urlObj.hostname;
// }
// Helper: Get file path from URL object
// function getFilePathFromUrl(urlObj) {
// 	let filePath = urlObj.pathname || '';
// 	if (filePath.startsWith('/')) filePath = filePath.slice(1);
// 	return filePath;
// }

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

	// Register WTTP protocol handler via extracted module
	registerWttpProtocol(ses)
}

app.on('session-created', (ses) => {
	if (ses !== session.defaultSession) {
		registerBundleProtocol(ses)
	}
})


