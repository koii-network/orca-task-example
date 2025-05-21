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
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = routes;
const namespace_wrapper_1 = require("@_koii/task-manager/namespace-wrapper");
const ipfs_1 = require("../utils/ipfs");
const constant_1 = require("../constant");
/**
 *
 * Define all your custom routes here
 *
 */
//Example route
function routes() {
    return __awaiter(this, void 0, void 0, function* () {
        namespace_wrapper_1.app.post("/submit-to-js", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("RECEIVED REQUEST FROM PYTHON SERVER");
                let { result } = req.body;
                console.log("value", result);
                const stakingKeypair = yield namespace_wrapper_1.namespaceWrapper.getSubmitterAccount();
                if (!stakingKeypair) {
                    console.log("STAKING KEYPAIR NOT FOUND, ABORTING FETCHING TODO");
                    return;
                }
                let stakingPubkey = stakingKeypair.publicKey.toBase58();
                const signature = yield namespace_wrapper_1.namespaceWrapper.payloadSigning({
                    action: "post-todo",
                    stakingKey: stakingPubkey,
                }, stakingKeypair.secretKey);
                console.log("Uploading to IPFS!");
                const cid = yield (0, ipfs_1.storeFile)(result);
                console.log("Uploading complete: ", cid);
                console.log("Sending response to middle server");
                // Call middle server to update the result
                yield fetch(`${constant_1.middleServerUrl}/post-todo-result`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        taskId: namespace_wrapper_1.TASK_ID || "TESTING_TASK_ID",
                        cid: cid,
                        result: result,
                        signature,
                        stakingPubkey
                    }),
                });
                yield namespace_wrapper_1.namespaceWrapper.storeSet(`submission`, cid);
                yield namespace_wrapper_1.namespaceWrapper.storeSet(`isWorkingOnTodo`, "false");
                res.status(200).json({ success: true, message: "success" });
            }
            catch (error) {
                if (error.message.includes("Staking wallet is not valid (Mismatch owner)")) {
                    const RED_CODE = "\x1b[91m";
                    const RESET_CODE = "\x1b[0m";
                    console.log(`${RED_CODE}Please provide a valid staking wallet path in .env for testing upload to IPFS${RESET_CODE}`);
                }
                else {
                    console.error(error);
                }
                res.status(500).json({ success: false, message: error.message });
            }
        }));
    });
}
if (!namespace_wrapper_1.TASK_ID) {
    routes();
}
