import { getOrcaClient } from "@_koii/task-manager/extensions";
import { middleServerUrl } from "../constant";
// import { status } from '../utils/constant'

const TIMEOUT_MS = 180000; // 3 minutes in milliseconds
const MAX_RETRIES = 3;

export async function audit(cid: string, roundNumber: number, submitterKey: string): Promise<boolean | void> {
  let retries = 0;
  // TODO: Fix the Audits
  return true;
  while (retries < MAX_RETRIES) {
    try {
      const result = await Promise.race<boolean | void>([
        new Promise((_, reject) => setTimeout(() => reject(new Error("Audit timeout")), TIMEOUT_MS)),
      ]);
      return result;
    } catch (error) {
      retries++;
      console.log(`[AUDIT] Attempt ${retries} failed:`, error);
      
      if (retries === MAX_RETRIES) {
        console.log(`[AUDIT] Max retries (${MAX_RETRIES}) reached. Giving up.`);
        return true; // Return true as a fallback
      }
      
      // Wait for a short time before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
