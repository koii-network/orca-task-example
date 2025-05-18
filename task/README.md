# Koii Task (`task/`)

This directory contains the Node.js application that runs as a Koii task. It orchestrates the overall workflow of fetching tasks, delegating computation, handling results, and interacting with the Koii network.

## Key Responsibilities

*   **Task Orchestration:** Manages the lifecycle of tasks, from acquisition to submission.
*   **Interaction with Middle Server:** Fetches "todos" (tasks to be performed) from the `middle-server` and sends back the computed results along with their IPFS CIDs.
*   **Orca Pod Management:** Delegates the actual computation to an "Orca pod".
    *   For local development, it starts and manages a Python Flask server (see [`./docker-container/README.md`](./docker-container/README.md)) that simulates the Orca pod.
    *   For production, it would interact with a Docker container deployed within the Koii Orca infrastructure, configured via `src/orcaSettings.ts`.
*   **IPFS Integration:** Stores computation results on IPFS (via `@_koii/storage-task-sdk`) before submitting them.
*   **Koii Network Interaction:** Handles submissions of results (CIDs) to the Koii blockchain and participates in the audit process (though the current audit logic is a placeholder). In many cases, audit logic is not required for MVPs

## Core Workflow (Local Development)

1.  **Setup (`src/task/0-setup.ts`):**
    *   A cron job is initialized to run every minute.
    *   In each cron cycle, the `task()` function (within `0-setup.ts`) attempts to fetch a new "todo".
    *   It checks a local flag (`isWorkingOnTodo`) to ensure only one task is processed at a time by this node.
    *   It signs a request and makes a POST call to `http://localhost:5000/fetch-todo` (the `middle-server`).

2.  **Delegation to Orca Pod (`src/orca.ts` & `src/task/0-setup.ts`):
    *   If a "todo" is received from the `middle-server`:
        *   `initializeOrcaClientForTesting()` (in `src/orca.ts`) ensures the Python Flask server from `task/docker-container/app.py` is started (listens on port 8080).
        *   The "todo" data is sent via `orcaClient.podCall()` (which uses `getOrcaClientForTesting()`) to the Python server's `/task/<todoId>` endpoint.
    *   The `isWorkingOnTodo` flag is set to `true`.

3.  **Receiving Results (Python -> Node.js) (`src/task/5-routes.ts`):
    *   The Python server, after processing the task, makes a POST request back to the Koii task's internal Express server (managed by `@_koii/task-manager`). This request hits the `/submit-to-js` route (or `/task/<TASK_ID>/submit-to-js` in a real environment).
    *   This route handler:
        *   Receives the computed `result`.
        *   Uploads the `result` to IPFS using `src/utils/ipfs.ts`, obtaining a `cid`.
        *   Signs a new payload and sends the `cid`, `result`, and signature to the `middle-server`'s `/post-todo-result` endpoint.
        *   Stores the `cid` locally using `namespaceWrapper.storeSet('submission', cid)` for the Koii submission phase.
        *   Sets the `isWorkingOnTodo` flag back to `false`.

4.  **Koii Network Phases:**
    *   **Submission (`src/task/2-submission.ts`):** Retrieves the stored `cid` and returns it for submission to the Koii blockchain.
    *   **Audit (`src/task/3-audit.ts`):** Called to audit other nodes' submissions. Currently, it's a placeholder and always returns `true`.

## Key Files and Directories

*   `src/index.ts`: Main entry point, initializes the Koii task manager with different lifecycle functions.
*   `src/task/0-setup.ts`: Contains the cron job logic for fetching tasks from the `middle-server` and dispatching them to the Orca pod.
*   `src/task/1-task.ts`: Placeholder for the main task execution logic (which is handled by the cron job in `0-setup.ts`).
*   `src/task/2-submission.ts`: Logic for submitting the task result (CID) to the Koii network.
*   `src/task/3-audit.ts`: Logic for auditing submissions from other nodes (currently a placeholder).
*   `src/task/4-distribution.ts`: Logic for handling reward distribution (not detailed in this README).
*   `src/task/5-routes.ts`: Defines custom Express routes, primarily to receive results back from the Python Orca pod.
*   `src/orca.ts`: Manages the Orca client. For local testing, it starts the Python (`docker-container/app.py`) server and provides a `podCall` function to interact with it.
*   `src/orcaSettings.ts`: Configures the Orca pod, including the Docker image URL and pod specification for production deployment.
*   `src/utils/ipfs.ts`: Utilities for uploading data to IPFS (via Koii Storage SDK) and retrieving it.
*   `src/constant.ts`: Defines constants, such as the `middleServerUrl`.
*   `docker-container/`: Contains the Python Flask application that simulates the Orca pod for local development.
    *   See [`./docker-container/README.md`](./docker-container/README.md) for details.
*   `package.json`: Project dependencies and scripts.

## Running

To start the Koii task (which also starts the local Python worker):

```bash
cd task
yarn start
```

Ensure the `middle-server` is running first. See the main project [Testing Process](../../testing-process.md) for full setup and execution details.