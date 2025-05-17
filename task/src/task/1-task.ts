import 'dotenv/config';
import dotenv from 'dotenv';

dotenv.config();

export async function task(roundNumber: number): Promise<void> {
  /**
   * Run your task and store the proofs to be submitted for auditing
   * It is expected you will store the proofs in your container
   * The submission of the proofs is done in the submission function
   */

  // -------- We aren't doing anything here because we are running a cron job in the setup.ts to pickup new tasks from middle-server automatically -----------
}
