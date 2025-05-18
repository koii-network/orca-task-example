# Orca Task Example Project

This project demonstrates a Koii task that interacts with a middle server to fetch tasks and an "Orca pod" (simulated by a local Python server for development) to perform computations.

## Overview

The system consists of three main components:

1.  **Koii Task (`./task`)**: A Node.js application responsible for orchestrating the workflow. It fetches tasks from the `middle-server`, delegates computation to an Orca pod, handles results, and interacts with the Koii network for submissions and audits.
    *   [More details](./task/README.md)
2.  **Middle Server (`./middle-server`)**: An Express.js application that acts as a backend. It provides "todos" (tasks) to the Koii task and receives the results of these computations.
    *   [More details](./middle-server/README.md)
3.  **Python Worker / Orca Pod Simulator (`./task/docker-container`)**: A Python Flask server that simulates the Orca pod environment for local development. It performs the actual computation (e.g., calculating Fibonacci numbers). In a production Koii environment, this would be a Docker container.
    *   [More details](./task/docker-container/README.md)

## Project Structure

```
.
├── README.md               # This file
├── testing-process.md      # Guide for setting up and testing the project
├── task/                   # Koii task Node.js application
│   ├── README.md           # Details about the Koii task
│   ├── docker-container/   # Python Flask server (Orca pod simulator)
│   │   └── README.md       # Details about the Python worker
│   ├── src/                # Source code for the Koii task
│   └── package.json
├── middle-server/          # Express.js middle server application
│   ├── README.md           # Details about the middle server
│   ├── src/                # Source code for the middle server
│   └── package.json
└── ... (other configuration files)
```

## Getting Started

For detailed instructions on how to set up, run, and test the project, please refer to the [Testing Process](./testing-process.md) guide. 