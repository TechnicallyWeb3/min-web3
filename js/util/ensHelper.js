const Web3 = require('web3');
const debug = require('debug')('ensHelper');

// You'll need to replace this with the actual Ethereum network RPC URL you're using
const ETHEREUM_RPC_URL = 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID';

const web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_RPC_URL));

async function getENSOwner(ensDomain) {
	debug(`Getting ENS owner for domain: ${ensDomain}`);
	try {
		// Resolve the ENS name to an address
		const address = await web3.eth.ens.getAddress(ensDomain);
		
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
		return { status: 'error', address: null, error: error.message };
	}
}

module.exports = { getENSOwner };