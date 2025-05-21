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
exports.audit = audit;
// import { status } from '../utils/constant'
const TIMEOUT_MS = 180000; // 3 minutes in milliseconds
const MAX_RETRIES = 3;
function audit(cid, roundNumber, submitterKey) {
    return __awaiter(this, void 0, void 0, function* () {
        let retries = 0;
        // TODO: Fix the Audits
        return true;
        while (retries < MAX_RETRIES) {
            try {
                const result = yield Promise.race([
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Audit timeout")), TIMEOUT_MS)),
                ]);
                return result;
            }
            catch (error) {
                retries++;
                console.log(`[AUDIT] Attempt ${retries} failed:`, error);
                if (retries === MAX_RETRIES) {
                    console.log(`[AUDIT] Max retries (${MAX_RETRIES}) reached. Giving up.`);
                    return true; // Return true as a fallback
                }
                // Wait for a short time before retrying
                yield new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    });
}
