import { initializeOrcaClient as initializeOrcaClientOrig } from "@_koii/task-manager/extensions";
import { getOrcaClient as getOrcaClientOrig } from '@_koii/task-manager/extensions';
import { TASK_ID } from "@_koii/namespace-wrapper";
import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";

// Use environment variables for the python server port
const pythonServerHost = process.env.PYTHON_SERVER_HOST || 'localhost';
const pythonServerPort = process.env.PYTHON_SERVER_PORT || '8080';
const pythonServer = `http://${pythonServerHost}:${pythonServerPort}/`;

function initializeOrcaClientForTesting() {

    dotenv.config();
    //start the python server in docker-container folder
    const containerDir = path.join(__dirname, "../docker-container");
    const RED_CODE = "\x1b[91m";
    const RESET_CODE = "\x1b[0m";
    const BLUE_CODE = "\x1b[94m"; // for Python logs

    // Use environment variable for Python command if available
    const pythonCommand = process.env.PYTHON_COMMAND || 'python3';

    console.log(
        `${RED_CODE}TEST MODE: Starting the python server in ${containerDir}${RESET_CODE}`
    ); const python = spawn(pythonCommand, ["-u","app.py"], {
        cwd: containerDir,
        stdio: ["ignore", "pipe", "pipe"],
    });
    // Handle stdout from Python
    python.stdout.on("data", (data) => {
        process.stdout.write(`${BLUE_CODE}[PYTHON] ${data}${RESET_CODE}`);
    });

    // Handle stderr from Python
    python.stderr.on("data", (data) => {
        process.stderr.write(`${BLUE_CODE}[PYTHON] ${data}${RESET_CODE}`);
    });

    python.on("exit", (code) => {
        console.log(`Python server exited with code ${code}`);
        process.exit(1);
    });
}
function getOrcaClientForTesting() {
    const podCall = async (url: string, data: any) => {
        console.log("Calling Python container with", url, " with ", data)
        try {
            const response = await fetch(pythonServer + url, data);
            return response.json();
        }
        catch (e) {
            console.error("ERROR CALLING PYTHON SERVER", e);
        }
    }
    return { podCall }
}
export const initializeOrcaClient = TASK_ID ? initializeOrcaClientOrig : initializeOrcaClientForTesting;
export const getOrcaClient = TASK_ID ? getOrcaClientOrig : getOrcaClientForTesting;