import { logger } from '@/lib/logger';
import ActivityCheckCron from './activityCheck';
import { envs } from '@/config';
import HealthCheck from './healthCheck';
import FeedbackReminderCron from './feedbackReminder';
import LeaderboardCron from './leaderboard';
import SurveyReminderCron from './surveyReminder';

export function initCronJobs(): void {
    logger.cron('Initializing cron jobs...');
    
    // Start all cron jobs
    ActivityCheckCron.start();
    FeedbackReminderCron.start();
    LeaderboardCron.start();
    SurveyReminderCron.start();

    if(envs.RENDER_DEPLOY) {
        HealthCheck.start()
    }
}

export function stopCronJobs(): void {
    logger.cron('Stopping all cron jobs...');
    
    ActivityCheckCron.stop();
    FeedbackReminderCron.stop();
}
