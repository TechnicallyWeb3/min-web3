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

async function fetchContractHTML(address) {
  const contract = new web3.eth.Contract([
    {
      constant: true,
      inputs: [],
      name: "getHTML",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    }
  ], address);

  try {
    const htmlData = await contract.methods.getHTML().call();
    return htmlData;
  } catch (error) {
    console.error('Error fetching HTML:', error);
    return null;
  }
}

module.exports = {
  fetchContractHTML
};
