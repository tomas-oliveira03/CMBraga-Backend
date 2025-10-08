import cron, {ScheduledTask} from 'node-cron';
import { CronExpression } from '@/helpers/utils';
import { logger } from '@/lib/logger';
import { AppDataSource } from '@/db';
import { ActivitySession } from '@/db/entities/ActivitySession';
import { LessThan } from 'typeorm';

class ActivityCheckCron {
    private static job: ScheduledTask | null = null;

    public static start(): void {
        if (this.job) {
            logger.cron('ActivityCheckCron: Job already running. Skipping duplicate schedule.');
            return;
        }

        this.job = cron.schedule(CronExpression.EVERY_HOUR, async () => {
            try {
                logger.cron('ActivityCheckCron: Starting activity check job execution');
                
                const now = new Date();
                const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                
                const result = await AppDataSource.getRepository(ActivitySession).update(
                    {
                        scheduledAt: LessThan(twelveHoursFromNow),
                        isClosed: false,
                    },
                    {
                        isClosed: true
                    }
                );

                logger.cron(`ActivityCheckCron: Completed - ${result.affected || 0} activities marked as closed`);
            } catch (err) {
                logger.cron('ActivityCheckCron: Error executing activity check job', { error: err });
            }
        }, {
            timezone: 'Europe/Lisbon',
        });
    }

    public static stop(): void {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger.cron('ActivityCheckCron: Cron job stopped');
        }
    }
}

export default ActivityCheckCron;
