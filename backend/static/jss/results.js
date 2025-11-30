// results.js
// Reads live vote counts from blockchain and updates UI.

window.addEventListener("DOMContentLoaded", async () => {
    const c1El = document.getElementById("cand1Votes");
    const c2El = document.getElementById("cand2Votes");
    const c3El = document.getElementById("cand3Votes");
    const chartEl = document.getElementById("resultsChart");
    const downloadBtn = document.getElementById("downloadCsvBtn");
    let chart = null;

    async function fetchCounts() {
        if (!window.CONTRACT_ADDRESS || window.CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
            const res = await fetch('/api/local/results');
            const data = await res.json();
            return [Number(data["1"]), Number(data["2"]), Number(data["3"])];
        }
        const rpc = (window.DEFAULT_CHAIN && window.DEFAULT_CHAIN.rpcUrls && window.DEFAULT_CHAIN.rpcUrls[0]) || undefined;
        const provider = rpc ? new ethers.JsonRpcProvider(rpc) : new ethers.JsonRpcProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const [v1, v2, v3] = await Promise.all([
            contract.getVotes(1),
            contract.getVotes(2),
            contract.getVotes(3)
        ]);
        return [Number(v1), Number(v2), Number(v3)];
    }

    function announceWinner(v1, v2, v3) {
        const winnerEl = document.getElementById('winnerAnnouncement');
        const arr = [v1, v2, v3];
        const max = Math.max(...arr);
        const winners = [];
        if (v1 === max) winners.push("Candidate One");
        if (v2 === max) winners.push("Candidate Two");
        if (v3 === max) winners.push("Candidate Three");
        if (!winnerEl) return;
        if (winners.length === 1) {
            winnerEl.textContent = `Winner: ${winners[0]} (${max} votes)`;
        } else {
            winnerEl.textContent = `Tie: ${winners.join(" vs ")} (${max} votes)`;
        }
    }

    async function render() {
        try {
            const [v1, v2, v3] = await fetchCounts();
            c1El.textContent = String(v1);
            c2El.textContent = String(v2);
            c3El.textContent = String(v3);
            announceWinner(v1, v2, v3);
            const data = {
                labels: ["Candidate One", "Candidate Two", "Candidate Three"],
                datasets: [{ label: "Votes", data: [v1, v2, v3], backgroundColor: ["#4f46e5", "#22c55e", "#f97316"] }]
            };
            if (!chart && chartEl && window.Chart) {
                chart = new Chart(chartEl, { type: 'bar', data, options: { responsive: true, scales: { y: { beginAtZero: true } } } });
            } else if (chart) {
                chart.data = data;
                chart.update();
            }
        } catch (err) {
            console.error(err);
            c1El.textContent = "Err";
            c2El.textContent = "Err";
            c3El.textContent = "Err";
        }
    }

    await render();
    setInterval(render, 5000);

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const res = await fetch('/api/local/export.csv');
            const text = await res.text();
            const blob = new Blob([text], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'results.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    }
});
