# Testing Flow for `main.test.ts`

This document outlines the testing flow executed by the `task/tests/main.test.ts` Jest test suite. This test is an integration test that simulates the full lifecycle of a Koii task, including setup, task execution, submission, auditing, and distribution.

## Overall Structure

The test suite is structured using Jest, with a `beforeAll` block for initial setup, several `it` blocks for individual test cases, and an `afterAll` block for cleanup.

## Initialization (`beforeAll`)

1.  **`namespaceWrapper.defaultTaskSetup()`**: This function is called first. It likely initializes the core environment for the task, potentially setting up mock storage, a mock K2 connection, or other foundational elements required for the Koii task SDK to operate in a test environment.
2.  **`initializeTaskManager(...)`**: This function initializes the Koii task manager with the specific logic for this task. It takes an object with the following functions as arguments:
    *   `setup`: Points to the `setup` function from `../src/task/0-setup.ts`.
    *   `task`: Points to the `task` function from `../src/task/1-task.ts`.
    *   `submission`: Points to the `submission` function from `../src/task/2-submission.ts`.
    *   `audit`: Points to the `audit` function from `../src/task/3-audit.ts`.
    *   `distribution`: Points to the `distribution` function from `../src/task/4-distribution.ts`.
    *   `routes`: Points to the `routes` function from `../src/task/5-routes.ts`.
    *   This step essentially configures the task manager with the actual code that will be executed during different phases of the task lifecycle.

## Test Cases (`describe("Performing the task", ...)`)

The following test cases are executed sequentially:

1.  **`should perform the core logic task`**
    *   Sets the current `round` to 1.
    *   Calls `taskRunner.task(round)`: This executes the main task logic defined in `src/task/1-task.ts` (or, more accurately, the cron job logic in `src/task/0-setup.ts` which `1-task.ts` might be a placeholder for, as noted in `task/README.md`). This involves:
        *   Fetching a "todo" from the `middle-server` (which needs to be running or mocked).
        *   Delegating this "todo" to the Python Orca pod simulator.
        *   The Python pod processes it and sends the result back to a route on the Koii task's internal server (defined in `src/task/5-routes.ts`).
        *   This route handler uploads the result to IPFS and notifies the `middle-server`.
    *   `await namespaceWrapper.storeGet("value")`: Attempts to retrieve a value named "value" from the namespace's key-value store. This "value" is expected to be set during the task execution (likely the result from the Python pod or the IPFS CID).
    *   Asserts that the retrieved `value` is defined and not null.

2.  **`should make the submission to k2 for dummy round 1`**
    *   Sets the current `round` to 1.
    *   Calls `await taskRunner.submitTask(round)`: This executes the submission logic defined in `src/task/2-submission.ts`. This function is responsible for preparing and returning the submission data (e.g., the IPFS CID of the result) that would be sent to the K2 layer.
    *   `await namespaceWrapper.getTaskState({})`: Retrieves the current state of the task from the namespace.
    *   Uses `Joi` to define a schema for the expected structure of `taskState?.submissions`.
    *   Validates `taskState?.submissions` against this schema.
    *   Asserts that there are no validation errors, meaning a submission with the correct structure was made and recorded in the task state.

3.  **`should make an audit on submission`**
    *   Sets the current `round` to 1.
    *   Calls `await taskRunner.auditTask(round)`: This executes the audit logic defined in `src/task/3-audit.ts`. This function is called to validate submissions from other nodes.
    *   `await namespaceWrapper.getTaskState({})`: Retrieves the task state.
    *   Uses `Joi` to define a schema for `taskState?.submissions_audit_trigger`.
    *   Validates the audit trigger data against the schema.
    *   Asserts no validation errors.

4.  **`should make the distribution submission to k2 for dummy round 1`**
    *   Sets the current `round` to 1.
    *   Calls `await taskRunner.submitDistributionList(round)`: This executes the logic to prepare and submit the distribution list (who gets rewards).
    *   `await namespaceWrapper.getTaskState({})`: Retrieves the task state.
    *   Uses `Joi` to define a schema for `taskState?.distribution_rewards_submission`.
    *   Validates the distribution submission data.
    *   Asserts no validation errors.

5.  **`should make an audit on distribution submission`**
    *   Sets the current `round` to 1.
    *   Calls `await taskRunner.auditDistribution(round)`: Executes logic to audit the distribution lists submitted by other nodes.
    *   `await namespaceWrapper.getTaskState({})`: Retrieves the task state.
    *   Uses `Joi` to define a schema for `taskState?.distributions_audit_trigger`.
    *   Validates the distribution audit trigger data.
    *   Asserts no validation errors.

6.  **`should make sure the submitted distribution list is valid`**
    *   Sets the current `round` to 1.
    *   `await namespaceWrapper.getDistributionList("", round)`: Retrieves the generated distribution list for the current round.
    *   Uses `Joi` to define a schema for the distribution list itself (a map of public keys to reward amounts).
    *   Validates the parsed distribution list.
    *   Asserts no validation errors.

7.  **`should test the endpoint`**
    *   Makes an HTTP GET request to `http://localhost:3000` (the Koii task's internal Express server, started by `namespaceWrapper.defaultTaskSetup()`).
    *   Asserts that the HTTP status is 200.
    *   Asserts that the response body is `{ message: "Running", status: 200 }`.

8.  **`should generate an empty distribution list when submission is 0`**
    *   This is a unit test for the `distribution` function itself (`src/task/4-distribution.ts`).
    *   Calls `distribution([], bounty, roundNumber)` with an empty array of submitters.
    *   Asserts that the returned distribution list is an empty object `{}`.

9.  **`should generate a distribution list contains all the submitters`**
    *   Another unit test for the `distribution` function.
    *   Creates a list of 5 mock `Submitter` objects with random vote and stake values.
    *   Calls `distribution(submitters, bounty, roundNumber)`.
    *   Asserts that the number of keys in the returned distribution list is equal to the number of mock submitters.
    *   Asserts that the public keys in the distribution list match the public keys of the mock submitters.

## Cleanup (`afterAll`)

1.  **`_server.close()`**: This closes the Express server that was started by `namespaceWrapper.defaultTaskSetup()` as part of the testing environment. This is important to free up the port (default 3000) and allow subsequent test runs or other applications to use it.

## Why the Test Might Be Slow or Hang

The `main.test.ts` is an integration test that simulates many parts of a real Koii task interacting with external (simulated) components. Potential reasons for slowness or hanging include:

1.  **Full Task Lifecycle Simulation:** The test runs through `task`, `submitTask`, `auditTask`, `submitDistributionList`, and `auditDistribution`. Each of these steps can involve significant computation, state changes, and potentially I/O operations (even if mocked).
2.  **Dependencies on External Services (Simulated):**
    *   **Middle Server:** The `taskRunner.task()` step relies on fetching data from the `middle-server`. If the actual `middle-server` isn't running and correctly configured (e.g., on `http://localhost:5001` as per our previous fixes), or if there's no mock in place for this test, this step could hang or timeout waiting for a response.
    *   **Python Orca Pod:** The task delegates computation to a Python server. `initializeOrcaClientForTesting` starts this Python server as a child process. If there are issues starting the Python server (e.g., `python3` not found, Flask not installed correctly in the environment the child process inherits, errors in `app.py`), or if communication with it fails, the test could hang.
    *   **IPFS Operations:** The `5-routes.ts` handler calls `storeFile` which interacts with `@_koii/storage-task-sdk`. While this might be mocked or use local storage for tests, any real network interaction or significant local file I/O could add time.
3.  **`namespaceWrapper` Internals:** The `namespaceWrapper` functions (e.g., `storeGet`, `storeSet`, `getTaskState`, `defaultTaskSetup`) manage the state of the task and its interaction with the (mocked) Koii environment. These operations, especially `defaultTaskSetup` which might initialize an Express server, can take time.
4.  **Timeouts:** Jest tests have default timeout limits. If any of the asynchronous operations within a test case (especially those involving external processes or simulated network calls) take longer than this timeout, Jest will interrupt the test, which might be perceived as a hang followed by a failure.
5.  **Sequential Execution and State:** The tests are largely sequential and build on the state created by previous tests (e.g., a submission must exist before it can be audited). If an early test fails to set up the correct state, later tests might behave unpredictably or take longer trying to operate on invalid state.
6.  **Resource Contention:** Running multiple servers (Node.js task server, Python Flask server, potentially a separate middle server if not mocked directly in tests) can consume system resources, slowing down operations.
7.  **Cleanup in `afterAll`**: The `_server.close()` is crucial. If this fails or is not reached (e.g., due to a test hanging indefinitely before `afterAll`), the port might remain occupied, causing issues for subsequent test runs.

Given the `ENOENT` error for `python` we saw earlier (and fixed to `python3`), issues with the Python child process startup were a likely culprit for previous hangs. The port conflict for the middle-server was another. Even with these fixed, the inherent complexity of simulating the entire task lifecycle means these tests can be slower than simple unit tests.
