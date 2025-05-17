import cron from 'node-cron';
import {getOrcaClient} from '@_koii/task-manager/extensions';
import { v4 as uuidv4 } from "uuid";
import { TASK_ID } from "@_koii/namespace-wrapper";

const middleServerUrl = 'http://localhost:3000';

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
    const response = await fetch(`${middleServerUrl}/get-task`);
    const data = await response.json();
    const orcaClient = await getOrcaClient();
    const uuid = uuidv4();
    data.task_id = TASK_ID;

    const result = await orcaClient.podCall(`task/${uuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log(result);
  } catch (error) {
    console.error('ERROR in setup cron job: ', error);
  }
}
