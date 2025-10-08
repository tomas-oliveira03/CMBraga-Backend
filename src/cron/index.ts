import { logger } from '@/lib/logger';
import ActivityCheckCron from './activityCheck';

export function initCronJobs(): void {
    logger.cron('Initializing cron jobs...');
    
    // Start all cron jobs
    ActivityCheckCron.start();
}

export function stopCronJobs(): void {
    logger.cron('Stopping all cron jobs...');
    
    ActivityCheckCron.stop();
}
