const { pathToFileURL } = require('url')
// const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
// const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));

const { wttp } = require('wttp-handler');



//ENS STARTED

const { Web3 } = require('web3');
const debug = require('debug')('ensHelper'); // Add this line
const namehash = require('eth-ens-namehash');

const providerUrl = 'https://mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1'; // Replace with your Infura project ID or another Ethereum provider
const web3ens = new Web3(new Web3.providers.HttpProvider(providerUrl));

const CUSTOM_ENS_RESOLVER_ADDRESS = '0x55906bEbf016553ece7D2005C6efFE903ba22D09'; // Replace with your custom resolver contract address
const CUSTOM_ENS_RESOLVER_ABI = [
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_feeRecipient",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldRecipient",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newRecipient",
				"type": "address"
			}
		],
		"name": "FeeRecipientChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "registrationFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "updateFee",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "removalFee",
				"type": "uint256"
			}
		],
		"name": "FeesUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			}
		],
		"name": "removeWebsiteAddr",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_feeRecipient",
				"type": "address"
			}
		],
		"name": "setFeeRecipient",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_registrationFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_updateFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_removalFee",
				"type": "uint256"
			}
		],
		"name": "setFees",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "setWebsiteAddr",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			},
			{
				"internalType": "address",
				"name": "newAddr",
				"type": "address"
			}
		],
		"name": "updateWebsiteAddr",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "WebsiteAddrChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			}
		],
		"name": "WebsiteAddrRemoved",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdrawBalance",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "feeRecipient",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registrationFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "removalFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "reverseWebsiteNode",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "updateFee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "node",
				"type": "bytes32"
			}
		],
		"name": "websiteAddr",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];


//unstoppable imports

const { Resolution } = require('@unstoppabledomains/resolution');
const { log } = require('util');

// Set the provider URL explicitly

const ethereumProviderUrl = 'https://mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1';
const polygonProviderUrl = 'https://polygon-mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1';


async function getENSOwner(ensDomain) {
	debug(`Getting ENS owner for domain: ${ensDomain}`);
	try {
		// Resolve the ENS name to an address
		const address = await web3ens.eth.ens.getAddress(ensDomain);

		if (address && address !== '0x0000000000000000000000000000000000000000') {
			debug(`Resolved address for ${ensDomain}: ${address}`);
			return { status: 'resolved', address: address };
		} else {
			debug(`Unable to resolve address for ${ensDomain}`);
			return { status: 'unresolved', address: null };
		}
	} catch (error) {
		debug('Error resolving ENS:', error);
		console.error('Error resolving ENS:', error);

		let errorMessage;
		let errorStatus;

		if (error.message.includes('ENS name not found')) {
			errorMessage = `ENS name not found: ${ensDomain}`;
			errorStatus = 'not_found';
		} else if (error.message.includes('network')) {
			errorMessage = 'Network error: Unable to connect to Ethereum network';
			errorStatus = 'network_error';
		} else if (error.message.includes('Invalid ENS name')) {
			errorMessage = `Invalid ENS name: ${ensDomain}`;
			errorStatus = 'invalid_name';
		} else {
			errorMessage = `Unexpected error resolving ENS name: ${error.message}`;
			errorStatus = 'unknown_error';
		}

		return {
			status: 'error',
			address: null,
			error: errorMessage,
			errorStatus: errorStatus
		};
	}
}
//ENS ENDED


//UNSTOPPABLE STARTED

const resolution = new Resolution({
	sourceConfig: {
		uns: {
			locations: {
				Layer1: {
					url: ethereumProviderUrl,
					network: "mainnet",
				},
				Layer2: {
					url: polygonProviderUrl,
					network: "polygon-mainnet",
				},
			},
		},
	},
});

async function resolveUnstoppableDomain(domain) {
	debug(`Resolving Unstoppable domain: ${domain}`);
	try {
		const address = await resolution.addr(domain, 'ETH');
		if (address) {
			debug(`Resolved address for ${domain}: ${address}`);
			return { status: 'resolved', address: address };
		} else {
			debug(`Unable to resolve address for ${domain}`);
			return { status: 'unresolved', address: null };
		}
	} catch (error) {
		debug('Error resolving Unstoppable domain:', error);
		console.error('Error resolving Unstoppable domain:', error);
		return {
			status: 'error',
			address: null,
			error: error.message
		};
	}
}

//UNSTOPPABLE ENDED



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
			if (isValidENS(contractAddress)) {
				console.log('Debug: ENS domain detected, resolving...');
				const ensResult = await getENSOwner(contractAddress);
				console.log(ensResult);
				if (ensResult.status === 'resolved') {
					contractAddress = ensResult.address;
				}
				// if (ensResult.status === 'website' || ensResult.status === 'owner') {
				//   contractAddress = ensResult.address;
				//   console.log('Debug: Resolved ENS to address:', contractAddress);
				// } else {
				//   throw new Error('Unable to resolve ENS domain');
				// }
			}

			else if (isValidUnstoppableDomain(contractAddress)) {
				console.log('Debug: Unstoppable domain detected, resolving...');
				const unstoppableResult = await resolveUnstoppableDomain(contractAddress);
				if (unstoppableResult.status === 'resolved') {
					console.log("WROKING");
					contractAddress = unstoppableResult.address;
					console.log('Debug: Resolved Unstoppable domain to address:', contractAddress);
				} else {
					throw new Error(`Unable to resolve Unstoppable domain: ${unstoppableResult.error || 'Unknown error'}`);
				}
			}



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
