import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ChildStationType, StationType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "@/server/middleware/auth";
import { StationActivitySession } from "@/db/entities/StationActivitySession";
import { In, IsNull, Not } from "typeorm";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ChildStation } from "@/db/entities/ChildStation";
import { Child } from "@/db/entities/Child";

const router = express.Router();

/**
 * @swagger
 * /activity-session/actions/start/{id}:
 *   post:
 *     summary: Start an activity session
 *     description: Marks an activity session as started (sets startedAt). Only instructors assigned to the activity can start it.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity started successfully"
 *       400:
 *         description: Activity already started or instructor not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               already_started:
 *                 summary: Activity already started
 *                 value:
 *                   message: "Activity session already started"
 *               not_assigned:
 *                 summary: Instructor not assigned
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/start/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const activity = AppDataSource.getRepository(ActivitySession);

        const activitySession = await activity.findOne({ 
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true
            }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        if (activitySession.startedAt) {
            return res.status(400).json({ message: "Activity session already started" });
        }

        const now = new Date();
        await activity.update(activitySession.id, { 
            startedAt: now, 
            updatedAt: now,
            startedById: req.user?.userId 
        });

        return res.status(200).json({ message: "Activity started successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


/**
 * @swagger
 * /activity-session/actions/end/{id}:
 *   post:
 *     summary: End an activity session
 *     description: Marks an activity session as finished (sets finishedAt). The activity must be started before it can be finished. Only instructors assigned to the activity can end it.
 *     tags:
 *       - Activity Session - Actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: Activity finished successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity finished successfully"
 *       400:
 *         description: Activity not started yet, already finished, or instructor not assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               not_started:
 *                 summary: Activity not started
 *                 value:
 *                   message: "Activity session not started yet"
 *               already_finished:
 *                 summary: Activity already finished
 *                 value:
 *                   message: "Activity session already finished"
 *               not_assigned:
 *                 summary: Instructor not assigned
 *                 value:
 *                   message: "Instructor is not assigned to this activity session"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/end/:id', authenticate, authorize(UserRole.INSTRUCTOR), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const activity = AppDataSource.getRepository(ActivitySession);

        const activitySession = await activity.findOne({ 
            where: { id: activitySessionId },
            relations: {
                instructorActivitySessions: true
            }
        });
        
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        if (!(activitySession.instructorActivitySessions && activitySession.instructorActivitySessions.some(ias => ias.instructorId === req.user?.userId))) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        if(!activitySession.startedAt){
            return res.status(400).json({ message: "Activity session not started yet"});
        }

        if (activitySession.finishedAt) {
            return res.status(400).json({ message: "Activity session already finished" });
        }

        const now = new Date();
        await activity.update(activitySession.id, { 
            finishedAt: now,
            updatedAt: now,
            finishedById: req.user?.userId
         });

        return res.status(200).json({ message: "Activity finished successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});

router.get('/stop', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.query.id;

        if (!activitySessionId || typeof activitySessionId !== "string") {
            return res.status(400).json({ message: "Activity session ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { 
                id: activitySessionId,
                stationActivitySessions: {
                    arrivedAt: IsNull()
                }
            },
            order: {
                stationActivitySessions: {
                    stopNumber: "ASC"
                }
            },
            relations: {
                stationActivitySessions: {
                    station: true
                }
            }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found or no more stations left" });
        }

        const stationId = activitySession.stationActivitySessions[0]?.stationId

        const childActivitySessions = await AppDataSource.getRepository(ChildActivitySession).find({
            where: {
                pickUpStationId: stationId
            },
            relations: {
                child: true
            }
        })

        const allChildrenToPickUpList = childActivitySessions.map(cas => cas.child)

        const childrenAlreadyChecked = await AppDataSource.getRepository(ChildStation).find({
            where: {
                activitySessionId: activitySessionId,
                stationId: stationId,
                childId: In(allChildrenToPickUpList.map(acp=> acp.id)),
                type: ChildStationType.IN
            },
            select: {
                childId: true
            }
        })

        type ChildWithCheck = Child & { isChecked: boolean };

        const allChildrenToPickUp = allChildrenToPickUpList.map(child => {
            return {
                ...child,
                isChecked: childrenAlreadyChecked.some(c => c.childId === child.id)
            } as ChildWithCheck;
        });

        const childrenPreviouslyChekedList = await AppDataSource.getRepository(Child).find({
            where: {
                childStations: {
                    activitySessionId: activitySessionId,
                    stationId: Not(stationId as string),
                    childId: Not(In(allChildrenToPickUpList.map(acp=> acp.id)))
                }
            },
            relations:{
                childStations: true
            }
        })

        const childrenPreviouslyChecked = childrenPreviouslyChekedList.filter(
            child => child.childStations.length === 1
        );
        
        let allChildrenToDropOff: Child[] = []
        const isStationASchool = activitySession.stationActivitySessions[0]?.station.type === StationType.SCHOOL
        if(isStationASchool){
            const allChildrenWhoHaveThisDropOffStation = await AppDataSource.getRepository(Child).find({
                where: {
                    dropOffStationId: stationId
                },
                relations: {
                    childStations: true
                }
            })

            allChildrenToDropOff = allChildrenWhoHaveThisDropOffStation
                .filter(child => child.childStations.length === 1 || child.childStations.length === 2)
                .map(child => ({
                    ...child,
                    isChecked: child.childStations.length === 2,
                })) as ChildWithCheck[];
            }

        await AppDataSource.getRepository(StationActivitySession).update(
            {
                stationId: stationId,
                activitySessionId: activitySessionId
            },
            {
                arrivedAt: new Date()
            }
        );

        const filteredChildrenPreviouslyChecked = childrenPreviouslyChecked.filter(
            prevChild => !allChildrenToDropOff.some(dropChild => dropChild.id === prevChild.id)
        );
        
        return res.status(200).json({
            childrenIn: allChildrenToPickUp,
            childrenStillIn: stripChildStations(filteredChildrenPreviouslyChecked),
            childrenOut: stripChildStations(allChildrenToDropOff)
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


const stripChildStations = (children: any[]) =>
  children.map(({ childStations, ...rest }) => rest);

export default router;
