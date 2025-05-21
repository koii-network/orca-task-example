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
exports.submission = submission;
const namespace_wrapper_1 = require("@_koii/namespace-wrapper");
function submission(roundNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * Retrieve the task proofs from your container and submit for auditing
         * Must return a string of max 512 bytes to be submitted on chain
         * The default implementation handles uploading the proofs to IPFS
         * and returning the CID
         */
        console.log(`[SUBMISSION] Starting submission process for round ${roundNumber}`);
        try {
            const cid = yield namespace_wrapper_1.namespaceWrapper.storeGet(`submission`);
            if (!cid) {
                console.log("No submission found, skipping submission");
            }
            return cid || void 0;
        }
        catch (error) {
            console.error("[SUBMISSION] Error during submission process:", error);
            throw error;
        }
    });
}
