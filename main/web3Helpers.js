const { Web3 } = require('web3'); // Correct import statement

// Chain configuration
const chain = {
  chainName: 'Polygon',
  chainSymbol: 'MATIC',
  chainId: 137,
  rpc: 'https://polygon-bor-rpc.publicnode.com',
  explorerPrefix: 'https://polygonscan.com/address/'
};

// Import the ABI from the JSON file
const { abi: webContractABI } = require('../web3/WebsiteContract.json');
// Initialize Web3
const masterChain = new Web3(chain.rpc);


async function fetchContractResource(address, path) {
  const contract = new masterChain.eth.Contract(webContractABI, address);
  path = path === "/" ? "index.html" : path;
  path = path.startsWith("/") ? path.substring(1) : path;

  try {
      console.log(`Fetching total chunks for path: ${path}`);
      const resourceInfo = await contract.methods.getResource(path.toString()).call();
      const totalChunks = resourceInfo[0];
      const contentType = resourceInfo[1]; // Keep content type consistent
      console.log(`Total chunks to fetch: ${totalChunks}`);
      console.log(`Content type: ${contentType}`);


      let content = "";

      for (let i = 0; i < totalChunks; i++) {
          console.log(`Fetching chunk ${i + 1} of ${totalChunks} for path: ${path}`);
          const result = await contract.methods.getResourceChunk(path, i).call();        

          console.log(result);

          function hexToUtf8(hex) {
            // Ensure hex is a string
            if (typeof hex !== 'string') {
                throw new TypeError('Expected a string');
            }
            
            // Remove the "0x" prefix if present
            hex = hex.startsWith('0x') ? hex.slice(2) : hex;

            // Convert the hex string into bytes (Uint8Array)
            const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            // Decode bytes into a UTF-8 string
            const decoder = new TextDecoder();
            return decoder.decode(bytes);
        }
          
          const hexString = result[0]; // Example hex string (hello world)
          const utf8String = hexToUtf8(hexString);
          console.log(utf8String); // Output: hello world
          
          
          content += utf8String; // Append the chunk
          
          console.log(`Fetched chunk ${i + 1}:`, result[0]);
      }

      console.log(`Completed fetching resource for path: ${path}`);
      return { content, contentType };
  } catch (error) {
      console.error('Error fetching resource chunks:', error);
      return null;
  }
}



module.exports = {
  fetchContractResource,
  webContractABI,
  masterChain
};
