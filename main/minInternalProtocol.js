const { pathToFileURL } = require('url')
// const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
// const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));


const { WTTPHandler } = require('@wttp/handler');


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

		const wttp = new WTTPHandler();
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

			const res = await wttp.fetch(`wttp://${contractAddress}${path}`).then(async (response) => {
				content =  response.body;
				console.log('Content:', response.body);


				contentType = response.headers['Content-Type'] || response.headers['content-type'];
				console.log("Content-Type:", contentType);

			});

			console.log(res)

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
