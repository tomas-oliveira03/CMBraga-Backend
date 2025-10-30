import cron, { ScheduledTask } from 'node-cron';
import { logger } from '@/lib/logger';
import { AppDataSource } from '@/db';
import { ActivitySession } from '@/db/entities/ActivitySession';
import { Feedback } from '@/db/entities/Feedback';
import { Not, IsNull, Between } from 'typeorm';
import { sendFeedbackReminder } from '@/server/services/email';
import { envs } from '@/config';

class FeedbackReminderCron {
    private static job: ScheduledTask | null = null;

    public static start(): void {
        if (this.job) {
            logger.cron('FeedbackReminderCron: Job already running. Skipping duplicate schedule.');
            return;
        }

        this.job = cron.schedule('0 20 * * *', async () => {
            try {
                logger.cron('FeedbackReminderCron: Starting feedback reminder job execution');
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const finishedActivities = await AppDataSource.getRepository(ActivitySession).find({
                    where: {
                        finishedAt: Between(today, tomorrow),
                    },
                    relations: {
                        childActivitySessions: {
                            child: true,
                            parent: true
                        }
                    }
                });

                let emailsSent = 0;

                for (const activity of finishedActivities) {
                    for (const childActivity of activity.childActivitySessions) {
                     
                        const existingFeedback = await AppDataSource.getRepository(Feedback).findOne({
                            where: {
                                activitySessionId: activity.id,
                                childId: childActivity.childId,
                                parentId: childActivity.parentId
                            }
                        });

                        if (!existingFeedback) {
                            const feedbackLink = `${envs.BASE_URL}/feedback?activityId=${activity.id}&childId=${childActivity.childId}&parentId=${childActivity.parentId}`;

                            await sendFeedbackReminder(childActivity.parent.email, childActivity.parent.name, childActivity.child.name, activity.type, feedbackLink);

                            emailsSent++;
                            logger.cron(`FeedbackReminderCron: Sent feedback reminder to ${childActivity.parent.email} for child ${childActivity.child.name}`);
                        }
                    }
                }

                logger.cron(`FeedbackReminderCron: Completed - ${emailsSent} feedback reminder emails sent`);
            } catch (err) {
                logger.cron('FeedbackReminderCron: Error executing feedback reminder job', { error: err });
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

export default FeedbackReminderCron;
