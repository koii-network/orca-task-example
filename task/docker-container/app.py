import os

from flask import Flask, request, jsonify, g
from utils import insertToDb, submit_to_js_task, compute_fibonacci
import threading
import time
import requests

app = Flask(__name__)
app.debug = False


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
    return jsonify({"status": "running"})


@app.post("/task/<task_id>", methods=["POST"])
def task_handler(task_id):
    try:
        data = request.get_json()
        print("Task received in python:", data)
        print("Starting task...")

        task_type = data.get("todo")
        input_value = data.get("input")
        task_id = data.get("todoID")
        
        result = None
        
        if task_type == "ComputeFibonacci":
            # Compute the fibonacci number
            result = compute_fibonacci(input_value)
        else:
            return jsonify({"error": f"Unknown task type: {task_type}"}), 400
        
        print(f"Task completed. Result: {result}")
        
        # Prepare the response to send back to the task's /submit-to-js endpoint
        response_data = {"result": result, "taskId": task_id}
        
        # You could send the result directly to the task's submit endpoint (http://localhost:3000/submit-to-js)
        # This would simulate what happens in production when the Orca pod returns data to the task container
        task_server = os.environ.get("TASK_SERVER_URL", "http://localhost:3000")
        submit_url = f"{task_server}/submit-to-js"
        
        print(f"Sending result to {submit_url}")
        response = requests.post(submit_url, json=response_data)
        
        # Also return the result directly as the response to this request
        return jsonify({"status": "success", "result": result, "taskId": task_id})
    
    except Exception as e:
        print(f"Error processing task: {e}")
        return jsonify({"error": str(e)}), 500


@app.post("/audit")
def audit_submission():
    print("Auditing submission")
    data = request.get_json()
    audit_result = data["submission"]["message"] == "Hello World!"
    # audit result must be a boolean
    return jsonify(audit_result)


if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_SERVER_PORT", "8080"))
    host = os.environ.get("PYTHON_SERVER_HOST", "0.0.0.0")
    app.run(host=host, port=port, threaded=False)
