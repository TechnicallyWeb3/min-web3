const { pathToFileURL } = require('url')
// const { getENSOwner } = require(path.join(__dirname, '..','min-web3', 'main', 'ensHelper'));
// const { resolveUnstoppableDomain } = require(path.join(__dirname, '..','min-web3', 'main', 'unstoppableHelper'));





//ENS STARTED

const { Web3 } = require('web3');
const debug = require('debug')('ensHelper'); // Add this line
const namehash = require('eth-ens-namehash');

const providerUrl = 'https://mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1'; // Replace with your Infura project ID or another Ethereum provider

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
const { log } = require('console');

// Set the provider URL explicitly

const ethereumProviderUrl = '';
const polygonProviderUrl = '';

const chains = {
	poly: [
		'https://polygon-mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1',
		'https://polygon.meowrpc.com',
		'https://polygon.drpc.org'
	],
	eth: [
		'https://mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1',
		'https://rpc.payload.de',
		'https://rpc.mevblocker.io'
	],
	arb: [
		'https://arb1.arbitrum.io/rpc'
	]
}

// Function to get a random RPC URL for a given chain
function getRandomRpcUrl(chainName) {
	const rpcUrls = chains[chainName];
	if (!rpcUrls) {
		throw new Error(`Chain ${chainName} not found`);
	}
	const randomIndex = Math.floor(Math.random() * rpcUrls.length);
	return rpcUrls[randomIndex];
}

const web3ens = new Web3(new Web3.providers.HttpProvider(getRandomRpcUrl('eth')));

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
					url: getRandomRpcUrl('eth'),
					network: "mainnet",
				},
				Layer2: {
					url: getRandomRpcUrl('poly'),
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
		let finalpath = '/';
		const urlString = url.href;

		try {
			const urlObj = new URL(urlString); // Create a URL object to easily access query parameters
			finalpath = urlObj.pathname || '/'; // Get the pathname or default to '/'
			console.log(finalpath);
			// Remove trailing slash if the path is not the home route
			if (finalpath !== '/' && finalpath.endsWith('/')) {
				finalpath = finalpath.slice(0, -1); // Remove the trailing slash
			}
		
			console.log(`Path found: ${finalpath}`);
		} catch (error) {
			console.error('Error parsing URL:', error);
			return new Response('Invalid URL', { status: 400 }); // Handle invalid URL error
		}

		// Check if url is a string
		console.log(url.href);
	
		if (typeof urlString !== 'string') {
			console.error('URL is not a string:', urlString);
			// Handle the error appropriately, e.g., return a response or set a default value
			return new Response('Invalid URL', { status: 400 });
		}

		console.log(urlString);

		const urlObj = new URL(urlString); // Create a URL object to easily access query parameters
		const chain = urlObj.searchParams.get('chain'); // Get the chain parameter if it exists
		let parsedChain = ''
		if (chain) {
			// Ensure the chain does not include any additional routing
			const chainParts = chain.split('/'); // Split by '/' to separate the chain from the path
			parsedChain = chainParts[0]; // Take only the first part as the chain
			console.log(`Chain found: ${parsedChain}`);
		} else {
			console.log('No chain parameter found');
		}


		let rpcUrl = '';

		if (parsedChain) {

			try {
				rpcUrl = getRandomRpcUrl(parsedChain);
				console.log(`Selected RPC URL for ${parsedChain}: ${rpcUrl}`);
			} catch (error) {
				console.error(error.message);

			}
		} else {
			const defaultChain = 'poly'; // Set your default chain here
			console.log('No chain specified in the URL. Using default chain:', defaultChain);

			try {
				rpcUrl = getRandomRpcUrl(defaultChain);
				console.log(`Selected RPC URL for default chain ${defaultChain}: ${rpcUrl}`);
			} catch (error) {
				console.error(error.message);
			}
		}


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
			console.log('Debug: Path:', finalpath);
			console.log('Debug: ',contractAddress)
			console.log('Debug: ',rpcUrl)
			const resource = await fetchContractResource(contractAddress, finalpath, rpcUrl);
			console.log('Debug: Resource:', resource.content);
			console.log('Debug: Resource type:', resource.contentType);

			if (resource.contentType === 'ipfs') {
				const ipfsData = JSON.parse(resource.content);

				  // Ensure the IPFS link starts with 'https://'
				  if (!ipfsData.link.startsWith('https://')) {
					ipfsData.link = `https://${ipfsData.link}`;
					console.log('Debug: IPFS link modified to include https://');
				}
				
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

			if (resource) {
				return new Response(resource.content, {
					status: 200,
					headers: { 'content-type': resource.contentType }
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
