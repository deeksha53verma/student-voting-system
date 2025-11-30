// results.js
// Reads live vote counts from blockchain and updates UI.

window.addEventListener("DOMContentLoaded", async () => {
    const c1El = document.getElementById("cand1Votes");
    const c2El = document.getElementById("cand2Votes");
    const c3El = document.getElementById("cand3Votes");

    try {
        if (!window.CONTRACT_ADDRESS || window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
            const res = await fetch('/api/local/results');
            const data = await res.json();
            c1El.textContent = String(data["1"]);
            c2El.textContent = String(data["2"]);
            c3El.textContent = String(data["3"]);
            return;
        }
        const rpc = (window.DEFAULT_CHAIN && window.DEFAULT_CHAIN.rpcUrls && window.DEFAULT_CHAIN.rpcUrls[0]) || undefined;
        const provider = rpc ? new ethers.JsonRpcProvider(rpc) : new ethers.JsonRpcProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const [v1, v2, v3] = await Promise.all([
            contract.getVotes(1),
            contract.getVotes(2),
            contract.getVotes(3)
        ]);

        c1El.textContent = v1.toString();
        c2El.textContent = v2.toString();
        c3El.textContent = v3.toString();
    } catch (err) {
        console.error(err);
        c1El.textContent = "Err";
        c2El.textContent = "Err";
        c3El.textContent = "Err";
    }
});
