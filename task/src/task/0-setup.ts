import { task } from "../utils/task";
export async function setup(): Promise<void> {
  // Setup a cron job to run every 1 minutes
  task();
}
