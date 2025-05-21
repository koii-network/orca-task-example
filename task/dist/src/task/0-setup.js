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
exports.setup = setup;
exports.task = task;
const node_cron_1 = __importDefault(require("node-cron"));
const namespace_wrapper_1 = require("@_koii/namespace-wrapper");
const constant_1 = require("../constant");
const orca_1 = require("../orca");
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        // Setup a cron job to run every 1 minutes
        console.log("CRON JOB SETUP TO RUN EVERY MINUTE AND FETCH TODO FROM MIDDLE SERVER");
        node_cron_1.default.schedule('* * * * *', () => {
            console.log('\n----------------------------------Triggered (Per 1 minute cron) Checking for a new task! --------------------------------- \n\n');
            task();
        });
    });
}
function task() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Do a fetch call to the middle server to get a new task and then pass it onto the docker container
        try {
            // Limiting each Node to perform 1 todo at a time below:
            let isWorkingOnTodo = yield namespace_wrapper_1.namespaceWrapper.storeGet(`isWorkingOnTodo`);
            if (isWorkingOnTodo == "true") {
                console.log("Already working on a todo");
                return;
            }
            const stakingKeypair = yield namespace_wrapper_1.namespaceWrapper.getSubmitterAccount();
            if (!stakingKeypair) {
                console.log("STAKING KEYPAIR NOT FOUND, ABORTING FETCHING TODO");
                return;
            }
            let stakingPubkey = stakingKeypair.publicKey.toBase58();
            const signature = yield namespace_wrapper_1.namespaceWrapper.payloadSigning({
                action: "fetch-todo",
                stakingKey: stakingPubkey,
            }, stakingKeypair.secretKey);
            const response = yield fetch(`${constant_1.middleServerUrl}/fetch-todo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signature, stakingKey: stakingPubkey }),
            });
            const resp = yield response.json();
            console.log("RESPONSE FROM MIDDLE SERVER: ", resp);
            const orcaClient = yield (0, orca_1.getOrcaClient)();
            resp.data.task_id = namespace_wrapper_1.TASK_ID || "TESTING_TASK_ID";
            console.log("Assigning todo to python container");
            const result = yield orcaClient.podCall(`task/${resp.data.todoID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(resp.data),
            });
            console.log("Reponse from python container: ", result);
            yield namespace_wrapper_1.namespaceWrapper.storeSet(`isWorkingOnTodo`, "true");
        }
        catch (error) {
            if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("fetch failed")) {
                console.error("Middle server is not running, please run middle server first");
                process.exit(1);
            }
            else {
                console.error('ERROR in setup cron job: ', error);
            }
        }
    });
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", (err) => __awaiter(void 0, void 0, void 0, function* () {
    console.error("Uncaught error, cleaning up:", err);
    yield cleanup();
}));
function cleanup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield namespace_wrapper_1.namespaceWrapper.storeSet("isWorkingOnTodo", "false");
        process.exit();
    });
}
