const { Web3 } = require('web3');
const debug = require('debug')('ensHelper'); // Add this line
const namehash = require('eth-ens-namehash');

const providerUrl = 'https://polygon-mainnet.infura.io/v3/0d66eec7a2e041a79a29a5361c4368e6'; // Replace with your Infura project ID or another Ethereum provider
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

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
      // Ensure we're working with the full name, including .eth if it's not present
      const fullDomain = ensDomain.includes('.') ? ensDomain : `${ensDomain}.eth`;
      const hashedName = namehash.hash(fullDomain);
      console.log(hashedName);
      debug(`Full domain: ${fullDomain}, Namehash: ${hashedName}`);

      const customResolverContract = new web3.eth.Contract(CUSTOM_ENS_RESOLVER_ABI, CUSTOM_ENS_RESOLVER_ADDRESS);
      console.log(customResolverContract);
      // Get the website address associated with the ENS name
      const websiteAddress = await customResolverContract.methods.websiteAddr(hashedName).call();
      console.log(websiteAddress);
      debug(`Website address for ${fullDomain}: ${websiteAddress}`);

      if (websiteAddress !== '0x0000000000000000000000000000000000000000') {
        debug(`Returning website address: ${websiteAddress}`);
        return websiteAddress;
      }

    //   // If no website address is set, fall back to the ENS owner
    //   const ensRegistry = new web3.eth.Contract(ENS_REGISTRY_ABI, ENS_REGISTRY_ADDRESS);
    //   const ownerAddress = await ensRegistry.methods.owner(hashedName).call();
    //   debug(`Owner address for ${fullDomain}: ${ownerAddress}`);

    //   if (ownerAddress === '0x0000000000000000000000000000000000000000') {
    //     debug('Owner address is null, domain might not be registered');
    //     return { status: 'unregistered', address: null };
    //   }

    //   debug(`Returning owner address: ${ownerAddress}`);
    //   return { status: 'owner', address: ownerAddress };
    } catch (error) {
      debug('Error getting ENS owner:', error);
      console.error('Error getting ENS owner:', error);
      return { status: 'error', address: null, error: error.message };
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