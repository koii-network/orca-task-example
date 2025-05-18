# Python Worker / Orca Pod Simulator (`task/docker-container/`)

This directory contains a Python Flask application that serves as the "Orca pod" simulator for local development. In a production Koii environment, the logic within this application (or similar) would be packaged into a Docker container and run by the Koii Orca infrastructure.

## Purpose

*   **Simulate Orca Pod:** Provides a local HTTP server that the Koii task (`task/`) can interact with as if it were a real Orca pod.
*   **Perform Computation:** Executes the actual task logic (e.g., calculating Fibonacci numbers) based on the "todo" received from the Koii task.
*   **Communicate Results:** Sends the computed result back to a specified endpoint on the Koii task's internal server.
*   **Simulate Audit Endpoint:** Provides a basic `/audit` endpoint that the Koii task can call during the audit phase.

## How It Works (in Local Development)

1.  **Started by Koii Task:** This Python Flask server (`app.py`) is not run manually. Instead, when the main Koii task (`task/src/index.ts`) starts in local development mode (i.e., `TASK_ID` is not set), the `initializeOrcaClientForTesting()` function in `task/src/orca.ts` spawns this Python application as a child process.
2.  **Listens for Tasks:** The Flask server listens on `http://localhost:8080`.
3.  **Receives Tasks:** The Koii task, via `orcaClient.podCall()`, sends an HTTP POST request to this server's `/task/<todoId>` endpoint with the task details.
4.  **Processes Tasks:**
    *   The `perform_task` function in `app.py` handles the computation (e.g., `fibonacci(input)`).
    *   It simulates work with a `time.sleep(40)`.
    *   The result is stored in a local SQLite database (`results.db`) via `utils.insertToDb()`.
5.  **Submits Results Back to Koii Task:**
    *   After computation, `utils.submit_to_js_task()` sends an HTTP POST request containing the result back to the Koii task. The target URL is typically `http://host.docker.internal:30017/task/<task_id>/submit-to-js` or `http://localhost:3000/submit-to-js` (for `TESTING_TASK_ID`), which is an endpoint on the Koii task's internal server (defined in `task/src/task/5-routes.ts`).

## API Endpoints

*   **`POST /task/<todoId>`**
    *   **Purpose:** Receives a task to execute from the Koii task.
    *   **Request Body (JSON):**
        ```json
        {
          "task_id": "<TASK_ID_or_TESTING_TASK_ID>",
          "input": <task_input_value>,
          "todo": "<task_type_string>" // e.g., "ComputeFibonacci"
        }
        ```
    *   **Action:** Starts the task asynchronously. Logs details and the computed result.
    *   **Response (JSON):**
        ```json
        {
          "todoId": "<todoId_from_path>",
          "status": "Task started"
        }
        ```

*   **`POST /audit`**
    *   **Purpose:** A basic audit endpoint for simulation.
    *   **Request Body (JSON):** Expected to contain submission data, e.g.:
        ```json
        {
          "submission": {
            "message": "Hello World!"
          }
        }
        ```
    *   **Action:** Checks if `data["submission"]["message"] == "Hello World!"`.
    *   **Response (JSON):** `true` or `false`.

*   **`GET /` & `POST /healthz`**
    *   Basic health check endpoints, both return `"OK"`.

## Key Files

*   `app.py`: The main Flask application file defining routes and task processing logic.
*   `utils.py`: Contains utility functions for database interaction (SQLite) and for submitting results back to the JavaScript Koii task.
*   `results.db`: SQLite database file created locally to store task results (primarily for demonstration/logging in this example).

## Dockerization (Conceptual)

While this directory runs as a direct Python process in local development, for a production Koii Orca deployment, you would typically:

1.  Create a `Dockerfile` in this directory.
2.  The `Dockerfile` would set up a Python environment, install dependencies (Flask, etc.), and copy `app.py` and `utils.py`.
3.  The `CMD` or `ENTRYPOINT` would be `python app.py`.
4.  This Docker image would be built and pushed to a container registry (e.g., Docker Hub).
5.  The `imageUrl` in `task/src/orcaSettings.ts` would point to this image.

The `task/src/orcaSettings.ts` file already defines a `customPodSpec` which includes environment variable passing and volume mounting, relevant for such a containerized deployment. 