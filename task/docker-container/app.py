from flask import Flask, request, jsonify, g
from utils import insertToDb, submit_to_js_task
import threading
import time

app = Flask(__name__)


def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def perform_task(todo, input, todoId, task_id):
    with app.app_context(): 
        print("\nStarting task...")
        time.sleep(40)
        # Perform the task
        if todo == "ComputeFibonacci":
            result = fibonacci(input)
        else:
            print("Unknown todo: " + todo)
            return
        # Store result in the database
        insertToDb(todoId, str(result))

        # Submit result to the JavaScript service, which mark it for submission and submits to middle server

        submit_to_js_task(
            task_id=task_id,
            data={
                "success": True,
                "result": {"task_id": task_id, "result": result, "todoId": todoId},
            },
        )

def run_todo_task_async(todo, input_value, todoId, task_id):
    task_thread = threading.Thread(
        target=perform_task, args=(todo, input_value, todoId, task_id)
    )
    task_thread.start()

@app.get("/")
def home():
    return "OK"


@app.post("/healthz")
def health_check():
    return "OK"


@app.post("/task/<todoId>")
def start_task(todoId):
    data = request.get_json()
    task_id = data.get("task_id")
    input_value = data.get("input")
    todo = data.get("todo")
    
    print(
        "\nTask received in python: "
        + todoId
        + " \nTODO: "
        + todo
        + " \nINPUT:"
        + str(input_value)
    )
    
    run_todo_task_async(todo, input_value, todoId, task_id)

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
