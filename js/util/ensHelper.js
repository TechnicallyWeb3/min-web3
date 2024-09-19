const { Web3 } = require('web3');
const debug = require('debug')('ensHelper'); // Add this line

const providerUrl = 'https://mainnet.infura.io/v3/0d66eec7a2e041a79a29a5361c4368e6'; // Replace with your Infura project ID or another Ethereum provider
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

const ENS_RESOLVER_ABI = [{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"addr","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_REGISTRY_ABI = [{"inputs":[{"internalType":"bytes32","name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];
const resolverAddress = '0x4976fb03C32e5B8cfe2D4f9F1B12031499a3fb95';

async function getENSOwner(ensDomain) {
  debug(`Getting ENS owner for domain: ${ensDomain}`);
  try {

    const owner = await web3.eth.ens.getAddress(ensDomain);
    console.log(owner);
    return owner;


    // const namehash = web3.utils.namehash(ensDomain);
    // debug(`Namehash: ${namehash}`);
    // const registryContract = new web3.eth.Contract(ENS_REGISTRY_ABI, ENS_REGISTRY_ADDRESS);
    // const resolverAddress = await registryContract.methods.resolver(namehash).call();
    // debug(`Resolver address: ${resolverAddress}`);
    
    // if (resolverAddress === '0x0000000000000000000000000000000000000000') {
    //   debug('Resolver address is null, returning null');
    //   return null;
    // }

    // const resolverContract = new web3.eth.Contract(ENS_RESOLVER_ABI, resolverAddress);
    // const address = await resolverContract.methods.addr(namehash).call();
    // debug(`ENS owner address: ${address}`);
    // return address;
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