// backend/static/js/vote.js

const connectBtn = document.getElementById("connectWalletBtn");
const walletStatus = document.getElementById("walletStatus");
const networkPill = document.getElementById("networkPill");
const submitVoteBtn = document.getElementById("submitVoteBtn");
const statusEl = document.getElementById("status");
const animation = document.getElementById("voteAnimation");
const selectedBox = document.getElementById("selectedCandidateBox");
const walletAddressDisplay = document.getElementById("walletAddressDisplay");
const voteStatusLabel = document.getElementById("voteStatusLabel");
const gasFeeEl = document.getElementById("gasFeeEstimate");
const txHashEl = document.getElementById("txHashDisplay");
const txHashLink = document.getElementById("txHashLink");
const contractInput = document.getElementById("contractAddressInput");
const saveContractBtn = document.getElementById("saveContractAddressBtn");
const openRemixBtn = document.getElementById("openRemixBtn");
const voteChartEl = document.getElementById("voteChart");
const voteWinnerEl = document.getElementById("voteWinner");
let voteChart = null;

let provider = null;
let signer = null;
let userAccount = null;
let contract = null;

// --------- Helper functions ----------

function formatWallet(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function showStatus(message, type = "info") {
    statusEl.textContent = message;
    statusEl.className = "message " + type;
}

function updateSelectedCandidate() {
    const selected = document.querySelector('input[name="candidate"]:checked');
    if (!selected || !selectedBox) return;
    const card = selected.closest(".candidate-card").querySelector(".candidate-inner");
    const name = card.querySelector("h3").textContent;
    const position = card.querySelector(".position").textContent;
    selectedBox.classList.remove("empty");
    selectedBox.innerHTML = `<strong>${name}</strong><br><span style="font-size: 0.78rem; color: #9ca3af;">${position}</span>`;
    if (gasFeeEl) updateGasEstimate();
}

async function updateGasEstimate() {
    try {
        if (!gasFeeEl) return;
        if (!contract) {
            gasFeeEl.textContent = "—";
            return;
        }
        const selected = document.querySelector('input[name="candidate"]:checked');
        if (!selected) {
            gasFeeEl.textContent = "—";
            return;
        }
        const candidateId = parseInt(selected.value, 10);
        const gas = await contract.estimateGas.vote(candidateId);
        const fee = await provider.getFeeData();
        const price = fee.maxFeePerGas || fee.gasPrice;
        if (!price) {
            gasFeeEl.textContent = "—";
            return;
        }
        const totalWei = gas * price;
        const eth = ethers.formatEther(totalWei);
        gasFeeEl.textContent = `≈ ${eth} ETH (testnet)`;
    } catch (e) {
        gasFeeEl.textContent = "—";
    }
}

async function initEthersAndContract() {
    if (!window.ethereum) { return; }

    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    signer = await provider.getSigner();
    userAccount = await signer.getAddress();

    walletStatus.textContent = "Wallet: " + formatWallet(userAccount);
    if (walletAddressDisplay) walletAddressDisplay.textContent = formatWallet(userAccount);

    const chainId = Number(network.chainId);
    networkPill.textContent = `Network: ${network.name || 'Unknown'} (chainId: ${chainId})`;

    if (window.DEFAULT_CHAIN && chainId !== window.DEFAULT_CHAIN.chainIdDec) {
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: window.DEFAULT_CHAIN.chainIdHex }] });
        } catch (switchErr) {
            try {
                await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [window.DEFAULT_CHAIN] });
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: window.DEFAULT_CHAIN.chainIdHex }] });
            } catch (addErr) {
                showStatus("Please switch to Sepolia in MetaMask.", "error");
            }
        }
    }

    if (!window.CONTRACT_ADDRESS || window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        contract = null;
        showStatus("Contract not configured.", "error");
        return;
    }

    contract = new ethers.Contract(
        window.CONTRACT_ADDRESS,
        window.CONTRACT_ABI,
        signer
    );

    // Try to see if this address already voted
    try {
        const already = await contract.hasVoted(userAccount);
        if (voteStatusLabel) {
            if (already) {
                voteStatusLabel.textContent = "Already voted";
                voteStatusLabel.style.background = "rgba(34,197,94,0.18)";
            } else {
                voteStatusLabel.textContent = "Eligible to vote";
                voteStatusLabel.style.background = "rgba(59,130,246,0.2)";
            }
        }
    } catch (err) {
        console.warn("Could not check hasVoted:", err);
        if (voteStatusLabel) voteStatusLabel.textContent = "Unable to check vote status";
    }
    if (gasFeeEl) await updateGasEstimate();
}

// --------- Event: Candidate selection ----------

document.querySelectorAll('input[name="candidate"]').forEach(radio => {
    radio.addEventListener("change", updateSelectedCandidate);
});

// --------- Event: Save contract address override ----------
if (saveContractBtn && contractInput) {
    saveContractBtn.addEventListener('click', () => {
        const addr = (contractInput.value || '').trim();
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
            showStatus("Invalid contract address.", "error");
            return;
        }
        window.localStorage.setItem('contractAddressOverride', addr);
        showStatus("Saved. Reloading...", "info");
        setTimeout(() => window.location.reload(), 800);
    });
}

// --------- Event: Open Remix with contract code ----------
if (openRemixBtn) {
openRemixBtn.addEventListener('click', () => {
    const src = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Election {\n    mapping(uint256 => uint256) public votes;\n    mapping(address => bool) public hasVoted;\n    event VoteSubmitted(address voter, uint256 candidateId);\n    function vote(uint256 candidateId) public {\n        require(!hasVoted[msg.sender], \"You already voted!\");\n        require(candidateId == 1 || candidateId == 2 || candidateId == 3, \"Invalid candidate\");\n        hasVoted[msg.sender] = true;\n        votes[candidateId] += 1;\n        emit VoteSubmitted(msg.sender, candidateId);\n    }\n    function getVotes(uint256 candidateId) public view returns (uint256) {\n        return votes[candidateId];\n    }\n}`;
    const url = `https://remix.ethereum.org/#language=Solidity&code=${encodeURIComponent(src)}`;
    window.open(url, '_blank');
});
}

// --------- Event: Connect MetaMask ----------

connectBtn.addEventListener("click", async () => {
    showStatus("", "info");

    if (!window.ethereum) { showStatus("MetaMask is not installed.", "error"); return; }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });

        await initEthersAndContract();

        connectBtn.textContent = "Connected";
        connectBtn.disabled = true;

        showStatus("Wallet connected!", "success");
    } catch (err) {
        console.error(err);
        showStatus(err.message || "Failed to connect wallet.", "error");
    }
});

// --------- Event: Cast Vote ----------

submitVoteBtn.addEventListener("click", async () => {
    showStatus("", "info");

    if (!window.ethereum) {
        showStatus("MetaMask is not installed.", "error");
        return;
    }

    if (!userAccount) {
        showStatus("Please connect MetaMask first.", "error");
        return;
    }

    if (!contract) { showStatus("Contract not configured.", "error"); return; }

    const selected = document.querySelector('input[name="candidate"]:checked');
    if (!selected) {
        showStatus("Please select a candidate!", "error");
        return;
    }

    const candidateId = parseInt(selected.value, 10);
    updateSelectedCandidate();

    try {
        animation.classList.remove("hidden");
        showStatus("Sending transaction to blockchain...", "info");

        const tx = await contract.vote(candidateId);
        console.log("Transaction sent:", tx.hash);
        if (txHashEl) txHashEl.textContent = tx.hash;
        if (txHashLink && window.DEFAULT_CHAIN && window.DEFAULT_CHAIN.blockExplorerUrls && window.DEFAULT_CHAIN.blockExplorerUrls[0]) {
            txHashLink.href = `${window.DEFAULT_CHAIN.blockExplorerUrls[0]}/tx/${tx.hash}`;
            txHashLink.style.display = 'inline-block';
        }

        showStatus("Waiting for confirmation...", "info");

        await tx.wait();
        animation.classList.add("hidden");

        showStatus("Vote successfully cast on blockchain!", "success");
        if (voteStatusLabel) voteStatusLabel.textContent = "Already voted";

        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 2000);
    } catch (err) {
        console.error(err);
        animation.classList.add("hidden");
        showStatus(err.reason || err.message || "Failed to cast vote.", "error");
    }
});

// --------- Live chart and winner ----------
async function fetchCounts() {
    try {
        if (!window.CONTRACT_ADDRESS || window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
            throw new Error('Contract not configured');
        }
        const rpc = (window.DEFAULT_CHAIN && window.DEFAULT_CHAIN.rpcUrls && window.DEFAULT_CHAIN.rpcUrls[0]) || undefined;
        const provider = rpc ? new ethers.JsonRpcProvider(rpc) : new ethers.JsonRpcProvider();
        const readContract = new ethers.Contract(window.CONTRACT_ADDRESS, window.CONTRACT_ABI, provider);
        const [v1, v2, v3] = await Promise.all([
            readContract.getVotes(1), readContract.getVotes(2), readContract.getVotes(3)
        ]);
        return [Number(v1), Number(v2), Number(v3)];
    } catch {
        return [0, 0, 0];
    }
}

function announceWinner(v1, v2, v3) {
    const arr = [v1, v2, v3];
    const max = Math.max(...arr);
    const winners = [];
    if (v1 === max) winners.push("Candidate One");
    if (v2 === max) winners.push("Candidate Two");
    if (v3 === max) winners.push("Candidate Three");
    if (winners.length === 0) {
        voteWinnerEl.textContent = "Leading: —";
    } else if (winners.length === 1) {
        voteWinnerEl.textContent = `Leading: ${winners[0]} (${max} votes)`;
    } else {
        voteWinnerEl.textContent = `Tie: ${winners.join(" vs ")} (${max} votes)`;
    }
}

async function renderVoteChart() {
    const [v1, v2, v3] = await fetchCounts();
    announceWinner(v1, v2, v3);
    const data = {
        labels: ["Candidate One", "Candidate Two", "Candidate Three"],
        datasets: [{ label: "Votes", data: [v1, v2, v3], backgroundColor: ["#4f46e5", "#22c55e", "#f97316"] }]
    };
    if (!voteChart && voteChartEl && window.Chart) {
        voteChart = new Chart(voteChartEl, { type: 'bar', data, options: { responsive: true, scales: { y: { beginAtZero: true } } } });
    } else if (voteChart) {
        voteChart.data = data;
        voteChart.update();
    }
}

renderVoteChart();
setInterval(renderVoteChart, 5000);

// --------- MetaMask event listeners ----------
if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());
}

// Prefill contract input with current effective address
if (contractInput) {
    contractInput.value = (window.CONTRACT_ADDRESS || "");
}
