const { Web3 } = require('web3'); // Correct import statement

// Chain configuration
const chain = {
  chainName: 'Polygon',
  chainSymbol: 'MATIC',
  chainId: 137,
  rpc: 'https://polygon-bor-rpc.publicnode.com',
  explorerPrefix: 'https://polygonscan.com/address/'
};

// Initialize Web3
const web3 = new Web3(chain.rpc);

async function fetchContractResource(address, path) {
  const contract = new web3.eth.Contract([
    {
      constant: true,
      inputs: [{ name: "path", type: "string" }],
      name: "getResource",
      outputs: [{ name: "content", type: "string" }, { name: "contentType", type: "string" }],
      type: "function",
    }
  ], address);

  try {
    const [content, contentType] = await contract.methods.getResource(path).call();
    return { content, contentType };
  } catch (error) {
    console.error('Error fetching resource:', error);
    return null;
  }
}

module.exports = {
  fetchContractResource
};
