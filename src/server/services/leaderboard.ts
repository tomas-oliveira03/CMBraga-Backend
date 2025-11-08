import { AppDataSource } from "@/db";
import { RankingTimeframe, RankingType } from "@/helpers/types";
import { ParentStat } from "@/db/entities/ParentStat";
import { ChildStat } from "@/db/entities/ChildStat";
import { IsNull, Not, In, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from "date-fns";


export function getLeaderboardTimeframes(timeframe: RankingTimeframe, back: number) {
    const now = new Date();
    switch (timeframe) {
        case RankingTimeframe.MONTHLY:
            // If back=0, current month; back=1, last month; back=2, two months ago, etc.
            return [
                {
                    label: back === 0 ? "this_month" : `month_${back}_ago`,
                    start: startOfMonth(subMonths(now, back)),
                    end: endOfMonth(subMonths(now, back))
                }
            ];
        case RankingTimeframe.ANNUALLY:
            // If back=0, current year; back=1, last year; back=2, two years ago, etc.
            return [
                {
                    label: back === 0 ? "this_year" : `year_${back}_ago`,
                    start: startOfYear(subYears(now, back)),
                    end: endOfYear(subYears(now, back))
                }
            ];
        case RankingTimeframe.ALL_TIME:
        default:
            return [
                {
                    label: "all_time",
                    start: null,
                    end: null
                }
            ];
    }
}

export async function getStats(type: RankingType, start: Date | null, end: Date | null) {
    switch(type) {

        case RankingType.PARENTS: {
            const repo = AppDataSource.getRepository(ParentStat);
            const where: any = {};
            if (start && end) {
                where.createdAt = Between(start, end);
            } else if (start) {
                where.createdAt = MoreThanOrEqual(start);
            } else if (end) {
                where.createdAt = LessThanOrEqual(end);
            } else {
                where.childStatId = Not(IsNull());
            }
            const parentStats = await repo.find({ where });
            const childStatIds = parentStats.map(ps => ps.childStatId).filter(id => id !== null);
            const childStats = await AppDataSource.getRepository(ChildStat).find({
                where: childStatIds.length ? { id: In(childStatIds) } : {}
            });
            
            const aggregatedStats: { [key: string]: any } = {};
            for (const ps of parentStats) {
                const cs = childStats.find(c => c.id === ps.childStatId);
                if (!cs) continue;
                if (!aggregatedStats[ps.parentId]) {
                    aggregatedStats[ps.parentId] = {
                        parentId: ps.parentId,
                        totalDistance: 0,
                        totalParticipations: 0,
                        totalPoints: 0
                    };
                }
                aggregatedStats[ps.parentId].totalDistance += cs.distanceMeters || 0;
                aggregatedStats[ps.parentId].totalPoints += cs.pointsEarned || 0;
                aggregatedStats[ps.parentId].totalParticipations += 1;
            }

            for (const parentId of Object.keys(aggregatedStats)) {
                const parent = await AppDataSource.getRepository("Parent").findOneBy({
                    id: parentId
                });
                if (parent) {
                    aggregatedStats[parentId].parentName = parent.name;
                }
            }

            return Object.values(aggregatedStats);
        }

        case RankingType.CHILDREN: {
            const repo = AppDataSource.getRepository(ChildStat);
            const where: any = {};
            if (start && end) {
                where.activityDate = Between(start, end);
            } else if (start) {
                where.activityDate = MoreThanOrEqual(start);
            } else if (end) {
                where.activityDate = LessThanOrEqual(end);
            } else {
                where.id = Not(IsNull());
            }
            const childStats = await repo.find({ where });

            const aggregatedStats: { [key: string]: any } = {};
            for (const cs of childStats) {
                if (!aggregatedStats[cs.childId || ""]) {
                    aggregatedStats[cs.childId || ""] = {
                        childId: cs.childId,
                        totalDistance: 0,
                        totalParticipations: 0,
                        totalPoints: 0
                    };
                }
                aggregatedStats[cs.childId || ""].totalDistance += cs.distanceMeters || 0;
                aggregatedStats[cs.childId || ""].totalPoints += cs.pointsEarned || 0;
                aggregatedStats[cs.childId || ""].totalParticipations += 1;
            }

            for (const childId of Object.keys(aggregatedStats)) {
                const child = await AppDataSource.getRepository("Child").findOneBy({
                    id: childId
                });
                if (child) {
                    aggregatedStats[childId].childName = child.name;
                }
            }

            return Object.values(aggregatedStats);
        }

        case RankingType.SCHOOLS:
            const repo = AppDataSource.getRepository(ChildStat);
            const where: any = {};
            if (start && end) {
                where.activityDate = Between(start, end);
            } else if (start) {
                where.activityDate = MoreThanOrEqual(start);
            } else if (end) {
                where.activityDate = LessThanOrEqual(end);
            } else {
                where.id = Not(IsNull());
            }
            const childStats = await repo.find({ where });
            // Aggregate by school
            const aggregatedStats: { [key: string]: any } = {};
            for (const cs of childStats) {
                const child = await AppDataSource.getRepository("Child").findOneBy({ id: cs.childId || "" });
                const school = child?.school || "Unknown";
                if (!aggregatedStats[school]) {
                    aggregatedStats[school] = {
                        school: school,
                        totalDistance: 0,
                        totalParticipations: 0,
                        totalPoints: 0
                    };
                }
                aggregatedStats[school].totalDistance += cs.distanceMeters || 0;
                aggregatedStats[school].totalPoints += cs.pointsEarned || 0;
                aggregatedStats[school].totalParticipations += 1;
            }

            return Object.values(aggregatedStats);

        case RankingType.SCHOOL_CLASSES:
            const repoClass = AppDataSource.getRepository(ChildStat);
            const whereClass: any = {};
            if (start && end) {
                whereClass.activityDate = Between(start, end);
            } else if (start) {
                whereClass.activityDate = MoreThanOrEqual(start);
            } else if (end) {
                whereClass.activityDate = LessThanOrEqual(end);
            } else {
                whereClass.id = Not(IsNull());
            }
            const childStatsClass = await repoClass.find({ where: whereClass });
            // Aggregate by school class
            const aggregatedStatsClass: { [key: string]: any } = {};
            for (const cs of childStatsClass) {
                const child = await AppDataSource.getRepository("Child").findOneBy({ id: cs.childId || "" });
                const schoolClass = `${child?.school || "Unknown"} - Grade ${child?.schoolGrade || "Unknown"}`;
                if (!aggregatedStatsClass[schoolClass]) {
                    aggregatedStatsClass[schoolClass] = {
                        schoolClass: schoolClass,
                        totalDistance: 0,
                        totalParticipations: 0,
                        totalPoints: 0
                    };
                }
                aggregatedStatsClass[schoolClass].totalDistance += cs.distanceMeters || 0;
                aggregatedStatsClass[schoolClass].totalPoints += cs.pointsEarned || 0;
                aggregatedStatsClass[schoolClass].totalParticipations += 1;
            }

            return Object.values(aggregatedStatsClass);
        default:
            return [];
    }
}