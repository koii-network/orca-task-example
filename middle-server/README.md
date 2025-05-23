# Middle Server (`middle-server/`)

This directory contains an Express.js application that serves as a centralized "middle server" or backend for the Koii task example.

## Purpose

Its primary functions are:

1.  **Providing Tasks ("Todos"):** It exposes an endpoint (`/fetch-todo`) that Koii tasks can call to get new tasks to perform. In this example, it returns a dummy task but could be extended to fetch tasks from a database or other sources.
2.  **Receiving Task Results:** It provides an endpoint (`/post-todo-result`) for Koii tasks to submit the results of their computations, along with an IPFS CID where the full result is stored.
3.  **Signature Verification:** It protects its endpoints by verifying signatures attached to incoming requests, ensuring that only authorized Koii tasks (those possessing the correct staking keys) can interact with it.

## API Endpoints

All endpoints expect JSON in the request body and return JSON.

*   **`POST /fetch-todo`**
    *   **Purpose:** Allows a Koii task to request a new task (a "todo").
    *   **Request Body:**
        ```json
        {
          "signature": "<base58_encoded_signature>",
          "stakingKey": "<base58_encoded_public_key>"
        }
        ```
        The `signature` is generated by the Koii task signing a payload like `{ action: "fetch-todo", stakingKey: "<stakingKey>" }`.
    *   **Response (Success - 200 OK):**
        ```json
        {
          "status": 200,
          "data": {
            "todoID": "<uuid>",
            "todo": "ComputeFibonacci", // Example task type
            "input": 10                  // Example input for the task
          }
        }
        ```
    *   **Response (Error - 400 Bad Request):** If signature is missing, `stakingKey` is missing, or signature verification fails.
        ```json
        {
          "status": 400,
          "message": "<error_message>"
        }
        ```

*   **`POST /post-todo-result`**
    *   **Purpose:** Allows a Koii task to submit the result of a completed task.
    *   **Request Body:**
        ```json
        {
          "signature": "<base58_encoded_signature>",
          "stakingPubkey": "<base58_encoded_public_key>",
          "result": { /* The actual result computed by the Orca pod */ },
          "cid": "<ipfs_content_identifier>",
          "taskId": "<koii_task_id_or_TESTING_TASK_ID>"
        }
        ```
        The `signature` is generated by the Koii task signing a payload like `{ action: "post-todo", stakingKey: "<stakingPubkey>" }`.
    *   **Response (Success - 200 OK):**
        ```json
        {
          "status": 200,
          "message": "success"
        }
        ```
        The server logs the received `result` and `cid`.
    *   **Response (Error - 400 Bad Request):** If signature or `stakingPubkey` is missing, or signature verification fails.

## Key Files

*   `src/index.ts`: Main entry point for the Express server. Defines routes and starts the server.
*   `src/utils/verifySignature.ts`: Contains the logic for verifying `tweetnacl` signatures provided in `bs58` format.
*   `package.json`: Project dependencies and scripts.

## Running

To start the middle server:

```bash
cd middle-server
yarn start
```

This typically starts the server on `http://localhost:5000`.

See the main project [Testing Process](../../testing-process.md) for full setup and execution details in conjunction with the Koii task. 