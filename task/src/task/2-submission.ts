import { storeFile } from "../utils/ipfs";
import { namespaceWrapper, TASK_ID } from "@_koii/namespace-wrapper";

export async function submission(roundNumber: number): Promise<string | void> {
  /**
   * Retrieve the task proofs from your container and submit for auditing
   * Must return a string of max 512 bytes to be submitted on chain
   * The default implementation handles uploading the proofs to IPFS
   * and returning the CID
   */

  console.log(`[SUBMISSION] Starting submission process for round ${roundNumber}`);

  try {
    const cid = await namespaceWrapper.storeGet(`submission`);
    if (!cid) {
      console.log("No submission found, skipping submission");
    }

    return cid || void 0;
  } catch (error) {
    console.error("[SUBMISSION] Error during submission process:", error);
    throw error;
  }
}
