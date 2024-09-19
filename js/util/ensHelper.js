const { Web3 } = require('web3');
const debug = require('debug')('ensHelper'); // Add this line
const namehash = require('eth-ens-namehash');

const providerUrl = 'https://mainnet.infura.io/v3/0d66eec7a2e041a79a29a5361c4368e6'; // Replace with your Infura project ID or another Ethereum provider
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

const CUSTOM_ENS_RESOLVER_ADDRESS = '0x...'; // Replace with your custom resolver contract address
const CUSTOM_ENS_RESOLVER_ABI = [
  // Add your custom resolver ABI here, including methods like `getContractAddress` and `getOwnerAddress`
];

async function getENSOwner(ensDomain) {
    debug(`Getting ENS owner for domain: ${ensDomain}`);
    try {
      // Ensure we're working with the full name, including .eth if it's not present
      const fullDomain = ensDomain.includes('.') ? ensDomain : `${ensDomain}.eth`;
      const hashedName = namehash.hash(fullDomain);
      debug(`Full domain: ${fullDomain}, Namehash: ${hashedName}`);

      const customResolverContract = new web3.eth.Contract(CUSTOM_ENS_RESOLVER_ABI, CUSTOM_ENS_RESOLVER_ADDRESS);
      
      // Get the website address associated with the ENS name
      const websiteAddress = await customResolverContract.methods.websiteAddr(hashedName).call();
      debug(`Website address for ${fullDomain}: ${websiteAddress}`);

      if (websiteAddress !== '0x0000000000000000000000000000000000000000') {
        debug(`Returning website address: ${websiteAddress}`);
        return websiteAddress;
      }

      // If no website address is set, fall back to the ENS owner
      const ensRegistry = new web3.eth.Contract(ENS_REGISTRY_ABI, ENS_REGISTRY_ADDRESS);
      const ownerAddress = await ensRegistry.methods.owner(hashedName).call();
      debug(`Owner address for ${fullDomain}: ${ownerAddress}`);

      if (ownerAddress === '0x0000000000000000000000000000000000000000') {
        debug('Owner address is null, returning null');
        return null;
      }

      debug(`Returning owner address: ${ownerAddress}`);
      return ownerAddress;
    } catch (error) {
      debug('Error getting ENS owner:', error);
      console.error('Error getting ENS owner:', error);
      return null;
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