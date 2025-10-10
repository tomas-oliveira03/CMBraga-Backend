import cron, { ScheduledTask } from 'node-cron';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { CronExpression } from '@/helpers/utils'; // Optional – or just use '0 * * * *' directly

class HealthCheck {
  private static job: ScheduledTask | null = null;

  public static start(): void {
    if (this.job) {
      logger.cron('HealthPingCron: Job already running. Skipping duplicate schedule.');
      return;
    }

    this.job = cron.schedule(CronExpression.EVERY_5_MINUTES, async () => {
      try {
        const url = 'https://cmbraga-backend.onrender.com/api/health';
        const response = await axios.get(url);
        logger.cron(`HealthPingCron: ✅ Ping successful (${response.status})`);
      } catch (err: any) {
        logger.cron('HealthPingCron: ❌ Ping failed', { error: err.message });
      }
    }, {
      timezone: 'Europe/Lisbon',
    });

    logger.cron('HealthPingCron: Started');
  }

  public static stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.cron('HealthPingCron: Stopped');
    }
  }
}

export default HealthCheck;
