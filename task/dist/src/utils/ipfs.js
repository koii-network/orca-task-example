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
exports.storeFile = storeFile;
exports.getFile = getFile;
const namespace_wrapper_1 = require("@_koii/namespace-wrapper");
const storage_task_sdk_1 = require("@_koii/storage-task-sdk");
const fs_1 = __importDefault(require("fs"));
function storeFile(data_1) {
    return __awaiter(this, arguments, void 0, function* (data, filename = "submission.json") {
        // Create a new instance of the Koii Storage Client
        const client = storage_task_sdk_1.KoiiStorageClient.getInstance({});
        const basePath = yield namespace_wrapper_1.namespaceWrapper.getBasePath();
        try {
            // Write the data to a temp file
            fs_1.default.writeFileSync(`${basePath}/${filename}`, typeof data === "string" ? data : JSON.stringify(data));
            // Get the user staking account, to be used for signing the upload request
            const userStaking = yield namespace_wrapper_1.namespaceWrapper.getSubmitterAccount();
            if (!userStaking) {
                throw new Error("No staking keypair found");
            }
            // Upload the file to IPFS and get the CID
            const { cid } = yield client.uploadFile(`${basePath}/${filename}`, userStaking);
            return cid;
        }
        catch (error) {
            throw error;
        }
        finally {
            // Delete the temp file
            fs_1.default.unlinkSync(`${basePath}/${filename}`);
        }
    });
}
function getFile(cid_1) {
    return __awaiter(this, arguments, void 0, function* (cid, filename = "submission.json") {
        const storageClient = storage_task_sdk_1.KoiiStorageClient.getInstance({});
        const fileBlob = yield storageClient.getFile(cid, filename);
        return yield fileBlob.text();
    });
}
