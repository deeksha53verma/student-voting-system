from flask import Flask, render_template


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
    return render_template("vote.html", candidates=candidates)


@app.route("/results")
def results():
    # Just load template, JS will fetch votes from blockchain
    return render_template("results.html")




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
