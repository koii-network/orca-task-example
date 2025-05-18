import { namespaceWrapper, app, TASK_ID } from "@_koii/task-manager/namespace-wrapper";
import { task } from "./1-task";
import { submission } from "./2-submission";
import { audit } from "./3-audit";
import { taskRunner } from "@_koii/task-manager";
import { storeFile } from "../utils/ipfs";
import { middleServerUrl } from "../constant";
import { sign } from "crypto";

/**
 *
 * Define all your custom routes here
 *
 */

//Example route
export async function routes() {
  app.post("/submit-to-js", async (req, res) => {
    try {
      console.log("RECEIVED REQUEST FROM PYTHON SERVER");
      let { result } = req.body
      console.log("value", result);
      const stakingKeypair = await namespaceWrapper.getSubmitterAccount()!;
      if (!stakingKeypair) {
        console.log("STAKING KEYPAIR NOT FOUND, ABORTING FETCHING TODO");
        return;
      }
      let stakingPubkey = stakingKeypair.publicKey.toBase58();
      const signature = await namespaceWrapper.payloadSigning(
        {
          action: "post-todo",
          stakingKey: stakingPubkey,
        },
        stakingKeypair.secretKey,
      );
      console.log("Uploading to IPFS!");
      const cid = await storeFile(result)

      console.log("Uploading complete: ", cid);
      console.log("Sending response to middle server")
      // Call middle server to update the result
      await fetch(`${middleServerUrl}/post-todo-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: TASK_ID || "TESTING_TASK_ID",
          cid: cid,
          result: result,
          signature,
          stakingPubkey
        }),
      })
      await namespaceWrapper.storeSet(`submission`, cid);
      await namespaceWrapper.storeSet(`isWorkingOnTodo`, "false");

      res.status(200).json({ success: true, message: "success" });

    } catch (error: any) {
      if (error.message.includes("Staking wallet is not valid (Mismatch owner)")) {
        const RED_CODE = "\x1b[91m";
        const RESET_CODE = "\x1b[0m";
        console.log(`${RED_CODE}Please provide a valid staking wallet path in .env for testing upload to IPFS${RESET_CODE}`)
      } else {
        console.error(error)
      }

      res.status(500).json({ success: false, message: error.message });
    }
  });
}

if (!TASK_ID) {
  routes()
}