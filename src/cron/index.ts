import { logger } from '@/lib/logger';
import ActivityCheckCron from './activityCheck';
import FeedbackReminderCron from './feedbackReminder';
import LeaderboardCron from './leaderboard';
import SurveyReminderCron from './surveyReminder';

export function initCronJobs(): void {
    logger.cron('Initializing cron jobs...');
    
    ActivityCheckCron.start();
    FeedbackReminderCron.start();
    LeaderboardCron.start();
    SurveyReminderCron.start();
}

export function stopCronJobs(): void {
    logger.cron('Stopping all cron jobs...');
    
    ActivityCheckCron.stop();
    FeedbackReminderCron.stop();
    LeaderboardCron.stop();
    SurveyReminderCron.stop();
}
