import cron, { ScheduledTask } from 'node-cron';
import { logger } from '@/lib/logger';
import { AppDataSource } from '@/db';
import { SurveyType, UserNotificationType } from '@/helpers/types';
import { CronExpression } from '@/helpers/utils';
import { Parent } from '@/db/entities/Parent';
import { createNotificationForUser } from '@/server/services/notification';

class SurveyReminderCron {
    private static job: ScheduledTask | null = null;

    public static start(): void {
        if (this.job) {
            logger.cron('SurveyReminderCron: Job already running. Skipping duplicate schedule.');
            return;
        }

        this.job = cron.schedule(CronExpression.EVERY_DAY_AT_11PM, async () => {
            try {
                const today = new Date();
                const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

                // Only run if today is the last day of the month
                if (today.getDate() !== lastDayOfMonth) {
                    return;
                }

                logger.cron('SurveyReminderCron: Starting survey reminder job execution');
                let notificationsSent = 0;

                const parents = await AppDataSource.getRepository(Parent).find({ 
                    relations: { 
                        parentChildren: {
                            child: true
                        }
                    }
                })

                for(const parent of parents){

                    const children = parent.parentChildren.map(pc => pc.child);
                    for(const child of children){

                        notificationsSent+=2

                        // Notify parent to fill out parent survey
                        createNotificationForUser({
                            type: UserNotificationType.SURVEY_REMINDER,
                            parentId: parent.email,
                            surveyType: SurveyType.PARENT,
                            child: {
                                id: child.id,
                                name: child.name
                            },
                        })

                        // Notify child to fill out child survey
                        createNotificationForUser({
                            type: UserNotificationType.SURVEY_REMINDER,
                            parentId: parent.email,
                            surveyType: SurveyType.CHILD,
                            child: {
                                id: child.id,
                                name: child.name
                            },
                        })
                    }
                }
                
                logger.cron(`SurveyReminderCron: Completed - ${notificationsSent} survey reminder notifications sent`);
            } catch (err) {
                logger.cron('SurveyReminderCron: Error executing survey reminder job', { error: err });
            }
        }, {
            timezone: 'Europe/Lisbon',
        });

        logger.cron('FeedbackReminderCron: Started (runs daily at 20:00)');
    }

    public static stop(): void {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger.cron('FeedbackReminderCron: Stopped');
        }
    }
}

export default SurveyReminderCron;
