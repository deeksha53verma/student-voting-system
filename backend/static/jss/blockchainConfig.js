// backend/static/js/blockchainConfig.js

// 🔴 TEMP ADDRESS – change this later to your real deployed contract
// Example: "0x1234abcd..."
// For now keep this dummy address so app can run.
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

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
