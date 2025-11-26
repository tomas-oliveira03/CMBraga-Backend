import express, { Request, Response } from "express";
import { RankingTimeframe, RankingType, LeaderboardType } from "@/helpers/types";
import { getLeaderboardTimeframes, getStats } from "../services/leaderboard";
import { authenticate } from "../middleware/auth";

const STAT_PAGE_SIZE = 50;

const router = express.Router();

router.get("/top/:type", authenticate, async (req: Request, res: Response) => {
    try {
        const type = req.params.type as RankingType;
        const back = parseInt(req.query.back as string) || 0;
        const parameter = req.query.parameter as LeaderboardType || LeaderboardType.DISTANCE;
        const page = parseInt(req.query.page as string) || 1;
        const timeframe = (req.query.timeframe as RankingTimeframe) || RankingTimeframe.MONTHLY;
        if (![RankingType.PARENTS, RankingType.CHILDREN, RankingType.SCHOOLS].includes(type)) {
            return res.status(400).json({ error: "Invalid leaderboard type" });
        }
        const timeframes = getLeaderboardTimeframes(timeframe, back);
        const results: any = {};
        for (const tf of timeframes) {
            results[tf.label] = await getStats(type, tf.start, tf.end);
        }

        for (const tfLabel of Object.keys(results)) {
            results[tfLabel].sort((a: any, b: any) => {
                switch (parameter) {
                    case LeaderboardType.DISTANCE:
                        return (b.totalDistance || 0) - (a.totalDistance || 0);
                    case LeaderboardType.POINTS:
                        return (b.totalPoints || 0) - (a.totalPoints || 0);
                    case LeaderboardType.PARTICIPATIONS:
                        return (b.totalParticipations || 0) - (a.totalParticipations || 0);
                    default:
                        return 0;
                }
            });
            results[tfLabel] = results[tfLabel].slice((page - 1) * STAT_PAGE_SIZE, page * STAT_PAGE_SIZE);
        }

        return res.json({ type, timeframe, leaderboard: results });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;