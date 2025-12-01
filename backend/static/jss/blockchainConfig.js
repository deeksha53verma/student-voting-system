// backend/static/js/blockchainConfig.js

// Contract address. Can be overridden via localStorage key 'contractAddressOverride'.
let CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const serverAddr = (typeof window !== 'undefined') ? window.SERVER_CONTRACT_ADDRESS : null;
if (serverAddr && /^0x[a-fA-F0-9]{40}$/.test(serverAddr)) {
  CONTRACT_ADDRESS = serverAddr;
} else {
  const override = (typeof window !== 'undefined') ? window.localStorage.getItem('contractAddressOverride') : null;
  if (override && /^0x[a-fA-F0-9]{40}$/.test(override)) {
    CONTRACT_ADDRESS = override;
  }
}

// Default chain config (Sepolia). Used for optional chain switching.
window.DEFAULT_CHAIN = {
  chainIdHex: "0xAA36A7", // 11155111
  chainIdDec: 11155111,
  chainName: "Sepolia Test Network",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

// ✅ ABI of your Election.sol contract
// contract Election {
//   mapping(uint256 => uint256) public votes;
//   mapping(address => bool) public hasVoted;
//   function vote(uint256 candidateId) public { ... }
//   function getVotes(uint256 candidateId) public view returns (uint256) { ... }
// }
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      }
    ],
    "name": "getVotes",
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "votes",
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
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Expose globally so other JS files can use them
window.CONTRACT_ADDRESS = CONTRACT_ADDRESS;
window.CONTRACT_ABI = CONTRACT_ABI;
