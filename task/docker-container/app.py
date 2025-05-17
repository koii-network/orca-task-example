from flask import Flask, request, jsonify, g
import sqlite3
import requests

app = Flask(__name__)

DATABASE = "results.db"


@app.get("/")
def home():
    return "Working"


@app.post("/healthz")
def health_check():
    return "OK"


@app.post("/task/<todoId>")
def start_task(todoId):
    print("Task started: " + todoId)
    data = request.get_json()
    task_id = data["task_id"]

    # The following task execution and submission can be offloaded to a separate thread:

    print("Starting task... This can be moved to a background thread.")

    # Perform the task
    result = fibonacci(10)

    # Store result in the database
    insertToDb(todoId, str(result))

    # Submit result to the JavaScript service
    requests.post(
        f"http://host.docker.internal:30017/task/{task_id}/submit-to-js",
        json={
            "success": True,
            "result": result
        },
    )

    # Consider moving the above block to a background thread for non-blocking behavior.
    
    return jsonify({"todoId": todoId, "status": "Task started"})




@app.post("/audit")
def audit_submission():
    print("Auditing submission")
    data = request.get_json()
    audit_result = data["submission"]["message"] == "Hello World!"
    # audit result must be a boolean
    return jsonify(audit_result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=False)


def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def insertToDb(todoId, submission):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO submissions (todoId, submission) VALUES (?, ?)",
        (todoId, submission),
    )
    db.commit()
    close_db()

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        # Initialize the database schema if it hasn't been initialized yet
        cursor = g.db.cursor()
        cursor.execute(
            "CREATE TABLE IF NOT EXISTS submissions (todoId varchar(255) PRIMARY KEY, submission TEXT)"
        )
        g.db.commit()
    return g.db


def close_db():
    db = g.pop("db", None)

    if db is not None:
        db.close()

