from flask import Flask, render_template, request, jsonify
import os, json, uuid


app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


@app.route("/")
def home():
    # Simple landing page = dashboard
    return render_template("dashboard.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/vote")
def vote():
    # Same candidates used everywhere
    candidates = [
        {"id": 1, "name": "Candidate One", "position": "Class Representative", "image": "cand1.jpg"},
        {"id": 2, "name": "Candidate Two", "position": "Class Representative", "image": "cand2.jpg"},
        {"id": 3, "name": "Candidate Three", "position": "Class Representative", "image": "cand3.jpg"},
    ]
    server_contract_address = os.environ.get('CONTRACT_ADDRESS', '').strip()
    return render_template("vote.html", candidates=candidates, server_contract_address=server_contract_address)


@app.route("/results")
def results():
    server_contract_address = os.environ.get('CONTRACT_ADDRESS', '').strip()
    return render_template("results.html", server_contract_address=server_contract_address)

# --- LocalChain (gasless) ---
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DATA_FILE = os.path.join(DATA_DIR, 'localchain.json')
ELECTION_FILE = os.path.join(DATA_DIR, 'election.json')

def _ensure_store():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({"votes": {"1": 0, "2": 0, "3": 0}, "hasVoted": {}}, f)
    if not os.path.exists(ELECTION_FILE):
        with open(ELECTION_FILE, 'w', encoding='utf-8') as f:
            json.dump({"endTs": 0}, f)

def _load_state():
    _ensure_store()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            v = data.get('votes', {})
            hv = data.get('hasVoted', {})
            return {1: int(v.get('1', 0)), 2: int(v.get('2', 0)), 3: int(v.get('3', 0))}, {k.lower(): bool(vv) for k, vv in hv.items()}
    except Exception:
        return {1: 0, 2: 0, 3: 0}, {}

def _save_state(votes, has_voted):
    _ensure_store()
    data = {"votes": {"1": votes[1], "2": votes[2], "3": votes[3]}, "hasVoted": has_voted}
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f)

def _load_election():
    _ensure_store()
    try:
        with open(ELECTION_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return int(data.get('endTs', 0))
    except Exception:
        return 0

def _save_election(end_ts):
    _ensure_store()
    with open(ELECTION_FILE, 'w', encoding='utf-8') as f:
        json.dump({"endTs": int(end_ts)}, f)

local_votes, local_has_voted = _load_state()

@app.post('/api/local/vote')
def api_local_vote():
    data = request.get_json(force=True)
    candidate_id = int(data.get('candidateId', 0))
    wallet = (data.get('wallet') or '').lower()
    if candidate_id not in (1, 2, 3):
        return jsonify({"error": "Invalid candidate"}), 400
    if not wallet:
        return jsonify({"error": "Missing wallet"}), 400
    if local_has_voted.get(wallet):
        return jsonify({"error": "You already voted!"}), 400
    local_has_voted[wallet] = True
    local_votes[candidate_id] += 1
    tx_hash = 'LC-' + uuid.uuid4().hex
    _save_state(local_votes, local_has_voted)
    return jsonify({"success": True, "txHash": tx_hash})

@app.get('/api/local/results')
def api_local_results():
    return jsonify({"1": local_votes[1], "2": local_votes[2], "3": local_votes[3]})

@app.get('/api/local/hasVoted')
def api_local_has_voted():
    wallet = (request.args.get('wallet') or '').lower()
    return jsonify({"hasVoted": bool(local_has_voted.get(wallet))})




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
