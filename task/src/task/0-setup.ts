import cron from 'node-cron';
import { namespaceWrapper, TASK_ID } from "@_koii/namespace-wrapper";
import { middleServerUrl } from '../constant';
import { getOrcaClient } from '../orca';
export async function setup(): Promise<void> {
  // Setup a cron job to run every 1 minutes
  cron.schedule('* * * * *', () => {
    console.log('(Per 1 minute cron) Checking for a new task!');
    task();
  });
}

export async function task() {
  // Do a fetch call to the middle server to get a new task and then pass it onto the docker container
  try {
    // Limiting each Node to perform 1 todo at a time below:
    let isWorkingOnTodo = await namespaceWrapper.storeGet(`isWorkingOnTodo`);
    if (isWorkingOnTodo == "true") {
      console.log("Already working on a todo");
      return;
    }
    const stakingKeypair = await namespaceWrapper.getSubmitterAccount()!;
    if (!stakingKeypair) {
      console.log("STAKING KEYPAIR NOT FOUND, ABORTING FETCHING TODO");
      return;
    }
    let stakingPubkey = stakingKeypair.publicKey.toBase58();
    const signature = await namespaceWrapper.payloadSigning(
      {
        action: "fetch-todo",
        stakingKey: stakingPubkey,
      },
      stakingKeypair.secretKey,
    );

    const response = await fetch(`${middleServerUrl}/fetch-todo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature, stakingKey: stakingPubkey }),

    });
    const resp = await response.json();
    console.log("RESPONSE FROM MIDDLE SERVER: ", resp);
    const orcaClient = await getOrcaClient();
    resp.data.task_id = TASK_ID || "TESTING_TASK_ID";
    console.log("ASSIGNING TODO TO PYTHON CONTAINER")
    const result = await orcaClient.podCall(`task/${resp.data.todoID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resp.data),
    });
    console.log("RESULT FROM PYTHON CONTAINER: ", result);
    await namespaceWrapper.storeSet(`isWorkingOnTodo`, "true");
  } catch (error) {
    console.error('ERROR in setup cron job: ', error);
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("uncaughtException", async (err) => {
  console.error("Uncaught error, cleaning up:", err);
  await cleanup();
});

async function cleanup() {
  await namespaceWrapper.storeSet("isWorkingOnTodo", "false");
  process.exit();
}