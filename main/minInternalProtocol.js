const { pathToFileURL } = require('url')

// Note: registerWttpProtocol is defined in wttpHandler.js which comes before this file in the build bundle
// No need to require it since files are concatenated together

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
		scheme: 'wttp',
		privileges: {
			standard: true,
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


