import cron, { ScheduledTask } from 'node-cron';
import { CronExpression } from '@/helpers/utils';
import { logger } from '@/lib/logger';
import { LessThan } from 'typeorm';
import { getStats } from '../server/services/leaderboard';
import { RankingType } from '@/helpers/types';
import { Badge } from '@/db/entities/Badge';
import { ClientBadge } from '@/db/entities/ClientBadge';
import { AppDataSource } from '@/db';

// Pick this month point leader in the last day of the month at 23:59:59, parent and children
class LeaderboardCron {
    private static job: ScheduledTask | null = null;
    public static start(): void {
        if (this.job) {
            logger.cron('LeaderboardCron: Job already running. Skipping duplicate schedule.');
            return;
        }
        this.job = cron.schedule(CronExpression.MONTHLY_AT_235959, async () => {
            try {
                logger.cron('LeaderboardCron: Starting leaderboard calculation job execution');
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const actualDate = new Date();
                actualDate.setHours(23, 59, 59, 999);
                const parentStats = await getStats(RankingType.PARENTS, startOfMonth, actualDate);
                const childrenStats = await getStats(RankingType.CHILDREN, startOfMonth, actualDate);

                const parentWinnerBasedOnPoints = parentStats.reduce((max, stat) => stat.points > max.points ? stat : max, parentStats[0]);
                const childWinnerBasedOnPoints = childrenStats.reduce((max, stat) => stat.points > max.points ? stat : max, childrenStats[0]);

                const winnerParentId = parentWinnerBasedOnPoints ? parentWinnerBasedOnPoints.parentId : 'N/A';
                const winnerChildId = childWinnerBasedOnPoints ? childWinnerBasedOnPoints.childId : 'N/A';

                const leaderboardBadges = await AppDataSource.getRepository(Badge).find({
                    where: {
                        criteria: 'leaderboard' as any
                    }
                });

                const orderedByValueneededIds = leaderboardBadges.sort((a, b) => (a.valueneeded || 0) - (b.valueneeded || 0)).map(b => b.id);
                let parentAwarded = false
                let childAwarded = false
                for (const badgeid of orderedByValueneededIds) {
                    if (parentAwarded && childAwarded) {
                        break;
                    }

                    if (winnerParentId !== 'N/A') {

                        const parentAlreadyHasBadge = await AppDataSource.getRepository(ClientBadge).findOne({
                            where: {
                                badgeId: badgeid,
                                parentId: winnerParentId
                            }
                        });
                        if (!parentAlreadyHasBadge && parentWinnerBasedOnPoints && !parentAwarded) {
                            const newParentBadge = AppDataSource.getRepository(ClientBadge).create({
                                badgeId: badgeid,
                                parentId: winnerParentId
                            });
                            await AppDataSource.getRepository(ClientBadge).save(newParentBadge);
                            logger.cron(`LeaderboardCron: Awarded badge ID ${badgeid} to Parent ID ${winnerParentId}`);
                            parentAwarded = true;
                        }
                    }

                    if (winnerChildId !== 'N/A') {
                        const childAlreadyHasBadge = await AppDataSource.getRepository(ClientBadge).findOne({
                            where: {
                                badgeId: badgeid,
                                childId: winnerChildId
                            }
                        });
                        if (!childAlreadyHasBadge && childWinnerBasedOnPoints && !childAwarded) {
                            const newChildBadge = AppDataSource.getRepository(ClientBadge).create({
                                badgeId: badgeid,
                                childId: winnerChildId
                            });
                            await AppDataSource.getRepository(ClientBadge).save(newChildBadge);
                            logger.cron(`LeaderboardCron: Awarded badge ID ${badgeid} to Child ID ${winnerChildId}`);
                            childAwarded = true;
                        }
                    }
                }
                logger.cron('LeaderboardCron: Leaderboard calculation job completed successfully');

            } catch (err) {
                logger.cron('LeaderboardCron: Error executing leaderboard calculation job', { error: err });
            }
        }, {
            timezone: 'Europe/Lisbon',
        });
        logger.cron('LeaderboardCron: Started');
    }
    public static stop(): void {
        if (this.job) {
            this.job.stop();
            this.job = null;
            logger.cron('LeaderboardCron: Cron job stopped');
        }
    }
}
export default LeaderboardCron;
