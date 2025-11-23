import cron, { ScheduledTask } from 'node-cron';
import { logger } from '@/lib/logger';
import { AppDataSource } from '@/db';
import { ActivitySession } from '@/db/entities/ActivitySession';
import { Feedback } from '@/db/entities/Feedback';
import { Between } from 'typeorm';
import { ChildStationType, UserNotificationType } from '@/helpers/types';
import { ChildActivitySession } from '@/db/entities/ChildActivitySession';
import { CronExpression } from '@/helpers/utils';
import { createNotificationForUser } from '@/server/services/notification';

class FeedbackReminderCron {
    private static job: ScheduledTask | null = null;

    public static start(): void {
        if (this.job) {
            logger.cron('FeedbackReminderCron: Job already running. Skipping duplicate schedule.');
            return;
        }

        this.job = cron.schedule(CronExpression.EVERY_DAY_AT_8PM, async () => {
            try {
                logger.cron('FeedbackReminderCron: Starting feedback reminder job execution');
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const finishedActivities = await AppDataSource.getRepository(ActivitySession).find({
                    where: {
                        finishedAt: Between(today, tomorrow),
                        childStations: {
                            type: ChildStationType.OUT
                        }
                    },
                    relations: {
                        childStations: {
                            child: true,
                        }
                    }
                });

                let notificationsSent = 0;

                console.log(`Found ${finishedActivities.length} finished activities today.`);
                for (const activity of finishedActivities) {
                    for (const childActivity of activity.childStations) {
                        console.log(`Processing child ${childActivity.childId} for activity ${activity.id}`);
                        const existingFeedback = await AppDataSource.getRepository(Feedback).findOne({
                            where: {
                                activitySessionId: activity.id,
                                childId: childActivity.childId
                            }
                        });

                        if (!existingFeedback) {

                            const childActivitySession = await AppDataSource.getRepository(ChildActivitySession).findOne({
                                where: {
                                    activitySessionId: activity.id,
                                    childId: childActivity.childId
                                },
                                relations: {
                                    parent: true,
                                }
                            });
                            if (!childActivitySession) {
                                logger.cron(`FeedbackReminderCron: No booking found for child ${childActivity.childId} in activity ${activity.id}. Skipping email.`);
                                continue;
                            }
                            
                            const parent = childActivitySession.parent;
                            await createNotificationForUser({
                                type: UserNotificationType.FEEDBACK_REMINDER,
                                parentId: parent.email,
                                activity: {
                                    id: activity.id,
                                    type: activity.type
                                },
                                child: {
                                    id: childActivity.child.id,
                                    name: childActivity.child.name
                                },
                            })
                            notificationsSent++;
                            logger.cron(`FeedbackReminderCron: Sent feedback reminder to ${parent.email} for child ${childActivity.child.name}`);
                        }
                    }
                }

                logger.cron(`FeedbackReminderCron: Completed - ${notificationsSent} feedback reminder notifications sent`);
            } catch (err) {
                console.log(err)
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
