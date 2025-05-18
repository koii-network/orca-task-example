import sqlite3
import requests
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




def submit_to_js_task(task_id, data):
    print("Submitting result to JS task...", task_id)
    if(task_id!="TESTING_TASK_ID"):
        requests.post(
            f"http://host.docker.internal:30017/task/{task_id}/submit-to-js",
            json=data,
        )
    else:
        resp = requests.post(
            f"http://localhost:3000/submit-to-js",
            json=data,
        )
        print(resp)
