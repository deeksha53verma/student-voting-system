// backend/static/js/vote.js

const connectBtn = document.getElementById("connectWalletBtn");
const walletStatus = document.getElementById("walletStatus");
const submitVoteBtn = document.getElementById("submitVoteBtn");
const statusEl = document.getElementById("status");
const animation = document.getElementById("voteAnimation");

let provider = null;
let signer = null;
let userAccount = null;
let contract = null;

// Shorten address for UI
function formatWallet(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Initialize ethers + contract
async function initEthers() {
    if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
    }

    // BrowserProvider for ethers v6
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAccount = await signer.getAddress();

    // Check if contract address is still dummy
    if (!window.CONTRACT_ADDRESS ||
        window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address not set yet. Deploy the contract and update CONTRACT_ADDRESS in blockchainConfig.js.");
    }

    contract = new ethers.Contract(
        window.CONTRACT_ADDRESS,
        window.CONTRACT_ABI,
        signer
    );
}

// Connect MetaMask button
connectBtn.addEventListener("click", async () => {
    statusEl.textContent = "";
    statusEl.className = "message";

    if (!window.ethereum) {
        statusEl.textContent = "MetaMask is not installed.";
        statusEl.classList.add("error");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        await initEthers();

        walletStatus.textContent = "Wallet: " + formatWallet(userAccount);
        connectBtn.textContent = "Connected";
        connectBtn.disabled = true;

        statusEl.textContent = "Wallet connected!";
        statusEl.classList.add("success");
    } catch (err) {
        console.error(err);
        statusEl.textContent = err.message || "Failed to connect wallet.";
        statusEl.classList.add("error");
    }
});

// Cast Vote button
submitVoteBtn.addEventListener("click", async () => {
    statusEl.textContent = "";
    statusEl.className = "message";

    // Must have wallet connected
    if (!userAccount || !contract) {
        statusEl.textContent = "Please connect MetaMask first.";
        statusEl.classList.add("error");
        return;
    }

    // Which candidate?
    const selected = document.querySelector('input[name="candidate"]:checked');
    if (!selected) {
        statusEl.textContent = "Please select a candidate!";
        statusEl.classList.add("error");
        return;
    }

    const candidateId = parseInt(selected.value, 10);

    // If contract address is still dummy, don't try to send tx
    if (window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        statusEl.textContent =
            "Smart contract not deployed yet (using dummy address). " +
            "Once you deploy on testnet, put the real address in blockchainConfig.js.";
        statusEl.classList.add("error");
        return;
    }

    try {
        // Show animation
        animation.classList.remove("hidden");

        // Send transaction to blockchain
        const tx = await contract.vote(candidateId);
        console.log("Transaction sent:", tx.hash);

        statusEl.textContent = "Waiting for confirmation...";
        statusEl.classList.add("info");

        // Wait for mining
        await tx.wait();
        console.log("Transaction confirmed");

        // Hide animation
        animation.classList.add("hidden");

        statusEl.textContent = "Vote successfully cast on blockchain!";
        statusEl.classList.remove("info");
        statusEl.classList.add("success");

        // Optional: redirect to dashboard after few seconds
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 2000);
    } catch (err) {
        console.error(err);
        animation.classList.add("hidden");
        statusEl.textContent = err.reason || err.message || "Failed to cast vote.";
        statusEl.classList.add("error");
    }
});
