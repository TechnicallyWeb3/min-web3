const { Resolution } = require('@unstoppabledomains/resolution');
const debug = require('debug')('unstoppableHelper');

// Set the provider URL explicitly

const ethereumProviderUrl = 'https://mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1';
const polygonProviderUrl = 'https://polygon-mainnet.infura.io/v3/2bc31646c11242b798f93e0f683055c1';

// custom provider config using the `Resolution` constructor options
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

module.exports = { resolveUnstoppableDomain };
