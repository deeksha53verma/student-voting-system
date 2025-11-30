const connectBtn = document.getElementById('connectDashboardWalletBtn');
const statusPill = document.getElementById('dashboardWalletStatus');
const timeEl = document.getElementById('timeRemaining');

let provider = null;
let signer = null;

function mask(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

async function connect() {
  if (!window.ethereum) {
    statusPill.textContent = 'MetaMask not installed';
    return;
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  signer = await provider.getSigner();
  const address = await signer.getAddress();
  statusPill.textContent = mask(address);
  connectBtn.textContent = 'Connected';
  connectBtn.disabled = true;
}

connectBtn.addEventListener('click', () => {
  connect().catch(() => { statusPill.textContent = 'Failed to connect'; });
});

async function startCountdown() {
  const now = Date.now();
  let serverEnd = 0;
  try {
    const r = await fetch('/api/local/election');
    const d = await r.json();
    serverEnd = Number(d.endTs || 0);
  } catch {}
  const defaultEnd = now + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 32 * 60 * 1000;
  const endTs = serverEnd && serverEnd > now ? serverEnd : defaultEnd;
  function tick() {
    const diff = Math.max(0, endTs - Date.now());
    const d = Math.floor(diff / (24*60*60*1000));
    const h = Math.floor((diff % (24*60*60*1000)) / (60*60*1000));
    const m = Math.floor((diff % (60*60*1000)) / (60*1000));
    const s = Math.floor((diff % (60*1000)) / 1000);
    timeEl.textContent = `${d} Days ${h} Hours ${m} Minutes ${s} Seconds`;
  }
  tick();
  setInterval(tick, 1000);
}

startCountdown();

if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => location.reload());
  window.ethereum.on('chainChanged', () => location.reload());
}

// Admin tools removed from UI
