// results.js
// Reads live vote counts from blockchain and updates UI.

window.addEventListener("DOMContentLoaded", async () => {
    const c1El = document.getElementById("cand1Votes");
    const c2El = document.getElementById("cand2Votes");
    const c3El = document.getElementById("cand3Votes");

    if (!window.ethereum) {
        c1El.textContent = "?";
        c2El.textContent = "?";
        c3El.textContent = "?";
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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
