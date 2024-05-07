const {Web3} = require('web3');

// Setup the Web3 provider to use the Polygon RPC
const RPC_URL = 'https://polygon-bor-rpc.publicnode.com/'; // Should use network.rpc attribute in settings
const web3 = new Web3(RPC_URL);

// 0x53681D337b9ACd156ce335eA96aF05298FE700aF active HTML contract

const contractABI = [
    {
        "inputs": [],
        "name": "getHTML",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
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
    }
]; // HTML Required ABI


export async function getHTML(contractAddress) {
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    try {
        // Check if contract contains the getHTML method
        const result = await contract.methods['getHTML']().call();
        // Load HTML page
        console.log('Result from smart contract:', result);
    } catch (error) {
        console.error('Error calling smart contract:', error);
        // Load explorer address page
    }
}

export async function getOwner(contractAddress) {
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    try {
        // Check if contract contains the getHTML method
        const result = await contract.methods['owner']().call();
        console.log('Result from smart contract:', result);
        return result;
    } catch (error) {
        console.error('Error calling smart contract:', error);
    }
}

