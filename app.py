from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/left")
def left_scenario():
    return render_template("scenario_left.html")

@app.route("/scenario_right.html")
def scenario_right():
    return render_template("scenario_right.html")


if __name__ == "__main__":
    app.run(debug=True)
