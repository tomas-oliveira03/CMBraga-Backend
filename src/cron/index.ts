import { logger } from '@/lib/logger';
import ActivityCheckCron from './activityCheck';
import FeedbackReminderCron from './feedbackReminder';
import LeaderboardCron from './leaderboard';

export function initCronJobs(): void {
    logger.cron('Initializing cron jobs...');
    
    ActivityCheckCron.start();
    FeedbackReminderCron.start();
    LeaderboardCron.start();
}

export function stopCronJobs(): void {
    logger.cron('Stopping all cron jobs...');
    
    ActivityCheckCron.stop();
    FeedbackReminderCron.stop();
    LeaderboardCron.stop();
}
