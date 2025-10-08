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
            logger.warn('ActivityCheckCron job already running. Skipping duplicate schedule.');
            return;
        }

        this.job = cron.schedule('51 13 * * *', async () => {
            try {
                const now = new Date();
                const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                
                await AppDataSource.getRepository(ActivitySession).update(
                    {
                        scheduledAt: LessThan(twelveHoursFromNow),
                        isClosed: false,
                    },
                    {
                        isClosed: true
                    }
                )

                logger.info('Daily cron job executed: closed all activity sessions');
            } catch (err) {
                logger.error('Error executing cron job:', err);
            }
        }, {
            timezone: 'Europe/Lisbon',
        });

        logger.info('Activity check cron job started - runs every day at midnight');
    }
}

export default ActivityCheckCron;
