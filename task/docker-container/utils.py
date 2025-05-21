import sqlite3
import requests
import os
from flask import g
DATABASE = "results.db"

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

def insertToDb(todoId, submission):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO submissions (todoId, submission) VALUES (?, ?)",
        (todoId, submission),
    )
    db.commit()
    close_db()

def compute_fibonacci(n):
    """Compute the nth Fibonacci number efficiently"""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    a, b = 0, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    return b

def submit_to_js_task(task_id, data):
    print("Submitting result to JS task...")
    task_server = os.environ.get("TASK_SERVER_URL", "http://localhost:3000")
    
    if(task_id!="TESTING_TASK_ID"):
        requests.post(
            f"http://host.docker.internal:30017/task/{task_id}/submit-to-js",
            json=data,
        )
    else:
        requests.post(
            f"{task_server}/submit-to-js",
            json=data,
        )