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
]


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

async function resolveENS(ensDomain) {
  debug(`Resolving ENS for domain: ${ensDomain}`);
  try {
    const address = await getENSOwner(ensDomain);
    if (address) {
      const resolvedUrl = `https://${ensDomain}.limo`;
      debug(`Resolved URL: ${resolvedUrl}`);
      return resolvedUrl;
    }
    debug('Unable to resolve ENS, returning null');
    return null;
  } catch (error) {
    debug('Error resolving ENS:', error);
    console.error('Error resolving ENS:', error);
    return null;
  }
}

module.exports = {
  getENSOwner,
  resolveENS
};