const { pathToFileURL } = require('url')
// const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
// const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));


const { wttp } = require('wttp-handler');


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
		console.log('Received web3 request:', req.url);
		const url = new URL(req.url);
		let contractAddress = url.hostname;
		const path = url.pathname || '/';

		console.log('Debug: Initial contract address or ENS:', contractAddress);

		function isValidENS(domain) {
			return /^([a-z0-9-]+\.)*[a-z0-9-]+\.eth$/i.test(domain);
		}

		function isValidUnstoppableDomain(domain) {

			const unstoppableTLDs = ['.crypto', '.zil', '.nft', '.blockchain', '.bitcoin', '.x', '.888', '.dao', '.wallet', 'unstoppable'];
			return unstoppableTLDs.some(tld => domain.endsWith(tld));
		}


		try {

			console.log('Debug: Final contract address:', contractAddress);
			console.log('Debug: Path:', path);

			let content = "";
			let contentType = ""

			await wttp.fetch(`wttp://${contractAddress}${path}`).then(async (response) => {
				content = await response.text();

				const MIME_TYPES_REVERSE = {
					// Text types
					'0x7470': 'text/plain',
					'0x7468': 'text/html',
					'0x7463': 'text/css',
					'0x7473': 'text/javascript',
					'0x746D': 'text/markdown',
					'0x7478': 'text/xml',
					'0x7467': 'text/csv',
					'0x7443': 'text/calendar',

					// Application types
					'0x786A': 'application/json',
					'0x7878': 'application/xml',
					'0x7870': 'application/pdf',
					'0x787A': 'application/zip',
					'0x786F': 'application/octet-stream',
					'0x7877': 'application/x-www-form-urlencoded',
					'0x7865': 'application/vnd.ms-excel',
					'0x7866': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

					// Image types
					'0x6970': 'image/png',
					'0x696A': 'image/jpeg',
					'0x6967': 'image/gif',
					'0x6977': 'image/webp',
					'0x6973': 'image/svg+xml',
					'0x6962': 'image/bmp',
					'0x6974': 'image/tiff',
					'0x6969': 'image/x-icon',

					// Audio types
					'0x616D': 'audio/mpeg',
					'0x6177': 'audio/wav',
					'0x616F': 'audio/ogg',

					// Video types
					'0x766D': 'video/mp4',
					'0x7677': 'video/webm',
					'0x766F': 'video/ogg',

					// Multipart types
					'0x7066': 'multipart/form-data',
					'0x7062': 'multipart/byteranges'
				}

				const contentTypeHeader = response.headers.get('content-type');
				contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;
				console.log("Content-Type:", contentType);



				// Find the corresponding MIME type
				const mimeType = MIME_TYPES_REVERSE[contentType] || 'UNKNOWN';

				console.log(mimeType); // Output: TEXT_PLAIN

				contentType = mimeType;
				console.log(mimeType)

			});

			console.log(content)

			function isJSON(content) {
				try {
					JSON.parse(content);
					return true; // It's a valid JSON
				} catch (e) {
					return false; // It's not a valid JSON
				}
			}



			if (isJSON(content)) {
				const ipfsData = JSON.parse(content);
				console.log('Debug: IPFS link:', ipfsData.link);
				console.log('Debug: IPFS content type:', ipfsData.type);

				// Fetch the content from IPFS using a gateway
				const ipfsResponse = await fetch(`${ipfsData.link}`);


				// Check if the response is okay
				if (!ipfsResponse.ok) {
					throw new Error(`Error fetching IPFS content: ${ipfsResponse.statusText}`);
				}

				// Read the response as a Blob for binary data
				const ipfsBlob = await ipfsResponse.blob();

				return new Response(ipfsBlob, {
					status: 200,
					headers: { 'content-type': ipfsData.type }
				});

			}

			if (content) {


				return new Response(content, {
					status: 200,
					headers: { 'content-type': contentType }
				});
			} else {
				return new Response('Resource not found', {
					status: 404,
					headers: { 'content-type': 'text/plain' }
				});
			}
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(`Error: ${error.message}`, {
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
