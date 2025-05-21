"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrcaClient = exports.initializeOrcaClient = void 0;
const extensions_1 = require("@_koii/task-manager/extensions");
const extensions_2 = require("@_koii/task-manager/extensions");
const namespace_wrapper_1 = require("@_koii/namespace-wrapper");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const pythonServer = "http://localhost:8080/";
function initializeOrcaClientForTesting() {
    dotenv_1.default.config();
    //start the python server in docker-container folder
    const containerDir = path_1.default.join(__dirname, "../docker-container");
    const RED_CODE = "\x1b[91m";
    const RESET_CODE = "\x1b[0m";
    const BLUE_CODE = "\x1b[94m"; // for Python logs
    console.log(`${RED_CODE}TEST MODE: Starting the python server in ${containerDir}${RESET_CODE}`);
    const python = (0, child_process_1.spawn)("python", ["-u", "app.py"], {
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
    const podCall = (url, data) => __awaiter(this, void 0, void 0, function* () {
        console.log("Calling Python container with", url, " with ", data);
        try {
            const response = yield fetch(pythonServer + url, data);
            return response.json();
        }
        catch (e) {
            console.error("ERROR CALLING PYTHON SERVER", e);
        }
    });
    return { podCall };
}
exports.initializeOrcaClient = namespace_wrapper_1.TASK_ID ? extensions_1.initializeOrcaClient : initializeOrcaClientForTesting;
exports.getOrcaClient = namespace_wrapper_1.TASK_ID ? extensions_2.getOrcaClient : getOrcaClientForTesting;
