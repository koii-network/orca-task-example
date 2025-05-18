import { namespaceWrapper, app, TASK_ID } from "@_koii/task-manager/namespace-wrapper";
import { task } from "./1-task";
import { submission } from "./2-submission";
import { audit } from "./3-audit";
import { taskRunner } from "@_koii/task-manager";
import { storeFile } from "../utils/ipfs";
import { middleServerUrl } from "../constant";

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
      await namespaceWrapper.storeSet(`isWorkingOnTodo`, "false");
      const cid = await storeFile(result)
      // Call middle server to update the result
      await fetch(`${middleServerUrl}/post-todo-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: TASK_ID || "TESTING_TASK_ID",
          cid: cid,
          result: result
        }),
      })
      await namespaceWrapper.storeSet(`submission`, cid);
      res.status(200).json({ success: true, message: "success" });

    } catch (error: any) {
      if(error.message.includes("Staking wallet is not valid (Mismatch owner)")){
        const RED_CODE = "\x1b[91m";
        const RESET_CODE = "\x1b[0m";
        console.log(`${RED_CODE}Please provide a valid staking wallet path in .env for testing upload to IPFS${RESET_CODE}`)
      }else{
        console.error(error)
      }
      
      res.status(200).json({ success: false, message: error.message });
    }
  });
}

if(!TASK_ID){
  routes()
}