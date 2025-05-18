import 'dotenv/config';
import dotenv from 'dotenv';

dotenv.config();

export async function task(roundNumber: number): Promise<void> {

  // -------- We aren't doing anything here because we are running a cron job in the setup.ts to pickup new tasks from middle-server automatically -----------
}
