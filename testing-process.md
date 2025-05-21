# Testing Process for Orca Task Example

This document outlines the steps to set up and test the Orca Task Example project locally.

## Prerequisites

Make sure you have the following installed:

*   Node.js (v18.17.0 or higher recommended)
*   Yarn
*   Python 3
*   pip (Python package installer)

## .env Setup

Start by coping .env.example to .env and then populate your variables.

If you do not have a Koii wallet configured, you can create one by following this tutorial: https://www.koii.network/docs/develop/command-line-tool/koii-cli/create-wallet

If you need to fund your wallet for deployment, you can use https://buy.koii.network to buy some compute credits.

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/koii-network/orca-task-example.git
    cd orca-task-example
    ```

2.  **Install Python Dependencies (Flask):
    ```bash
    # If pip is aliased to pip3, or if pip points to Python 3
    pip install flask
    # Or, if you need to specify pip3 explicitly:
    pip3 install flask
    ```
    *Note: If you encounter environment issues (e.g., `externally-managed-environment`), you might need to use a virtual environment or a flag like `--break-system-packages` (e.g., `pip3 install flask --break-system-packages`). Using a virtual environment is generally recommended for Python projects.*

3.  **Install Dependencies for the Koii Task:**
    ```bash
    cd task
    yarn install
    cd ..
    ```

4.  **Install Dependencies for the Middle Server:**
    ```bash
    cd middle-server
    yarn install
    cd ..
    ```

## Running the Application for Testing

You will need two separate terminal windows to run the Koii task and the middle server.

1.  **Start the Middle Server:**
    *   Open a terminal window.
    *   Navigate to the `middle-server` directory.
    *   Run the start command:
        ```bash
        cd middle-server
        yarn start
        ```
    *   This will start the Express.js server, typically on `http://localhost:5000`.
    *   You should see logs indicating the server is running.

2.  **Start the Koii Task:**
    *   Open a *new* terminal window.
    *   Navigate to the `task` directory.
    *   Run the start command:
        ```bash
        cd task
        yarn start
        ```
    *   This will start the Koii task Node.js application.
    *   For local testing, this process also automatically starts the Python Flask server (Orca pod simulator) from the `task/docker-container` directory. You should see logs from both the Node.js task and the Python server (prefixed with `[PYTHON]`) in this terminal.

## Expected Behavior and Logs

Once both services are running:

*   **Koii Task Terminal (`task/`):**
    *   You'll see logs indicating the cron job setup (`CRON JOB SETUP TO RUN EVERY MINUTE...`).
    *   Every minute, the cron job will trigger (`Triggered (Per 1 minute cron)...`).
    *   The task will attempt to fetch a "todo" from the `middle-server`.
        *   Logs showing the request being made and the response from the `middle-server`.
    *   The task will then send this "todo" to the Python container (local Flask server).
        *   Logs showing `Assigning todo to python container` and the response from the Python container.
    *   The Python server's logs (e.g., `[PYTHON] Task received in python...`, `[PYTHON] Starting task...`) will appear here as its output is piped.
    *   After the Python server processes the task, it sends the result back to a route on the Koii task's internal server.
        *   Logs like `RECEIVED REQUEST FROM PYTHON SERVER`, `Uploading to IPFS!`, `Sending response to middle server`.
    *   The flag `isWorkingOnTodo` will be set to `false`, allowing a new task to be picked up in the next cron cycle.
*   **Middle Server Terminal (`middle-server/`):**
    *   You'll see logs when the Koii task makes requests:
        *   For `/fetch-todo`: `RECEIVED FETCH TODO REQUEST BY ...`.
        *   For `/post-todo-result`: `RECEIVED Result: ... CID ...`.

By following these logs across both terminals, you can trace the flow of data: from the Koii task requesting a todo, to the `middle-server` providing it, to the Koii task delegating it to the Python worker, the worker processing it, the result being sent back to the Koii task, stored on IPFS, and finally reported back to the `middle-server`.

## Troubleshooting

*   **`EADDRINUSE` error:** If you see an error like `Error: listen EADDRINUSE: address already in use :::5000` (for the middle server) or a similar error for port 8080 (Python server, though less likely as it's managed by the task), it means another process is already using that port. Ensure no other instances of these servers are running.
*   **`fetch failed` in Koii task logs:** This usually means the `middle-server` is not running or not accessible at `http://localhost:5000`. Make sure the middle server was started successfully first.
*   **Python `ModuleNotFoundError`:** If the Python server fails to start due to missing modules (e.g., Flask), ensure you've correctly installed the Python dependencies as per the setup instructions.
*   **Peer Dependency Warnings:** During `yarn install`, you might see warnings about unmet peer dependencies (e.g., for Babel or ESLint). For this example project, these can often be ignored if the application still runs correctly. If they cause runtime issues, further investigation into specific versions might be needed. 