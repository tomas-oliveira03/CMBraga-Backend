import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { CreateActivitySessionSchema, UpdateActivitySessionSchema } from "../schemas/activitySession";
import { z } from "zod";
import { Admin, In } from "typeorm";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { Child } from "@/db/entities/Child";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { ParentChild } from "@/db/entities/ParentChild";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@/helpers/types";
import { Instructor } from "@/db/entities/Instructor";
import { InstructorActivitySession } from "@/db/entities/InstructorActivitySession";

const router = express.Router();




/**
 * @swagger
 * /activity-session/child/{id}:
 *   get:
 *     summary: Get all children from a specific activity session
 *     description: Returns a list of all child activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of child activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   registeredAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   child:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "Ana Costa"
 *                       gender:
 *                         type: string
 *                         enum: [male, female]
 *                         example: "female"
 *                       school:
 *                         type: string
 *                         example: "Escola Básica de Braga"
 *                       dateOfBirth:
 *                         type: string
 *                         format: date
 *                         example: "2016-02-14"
 *                       healthProblems:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           allergies:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["lactose"]
 *                           chronicDiseases:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: []
 *                           surgeries:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                 year:
 *                                   type: number
 *                             example: []
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-05T14:22:01.592Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity not found"
 */
// Get all children from an activity
router.get('/child/:id', async (req: Request, res: Response) => {
    const activityId = req.params.id;
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            childActivitySessions: {
                child: true
            }
        },
        select: {
            childActivitySessions: {
                registeredAt: true,
                child: true
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    return res.status(200).json(activityInfo?.childActivitySessions);
});



/**
 * @swagger
 * /activity-session/child/{id}:
 *   post:
 *     summary: Add child to an activity session
 *     description: Adds a child to a specific activity session. Parent can only add their own children.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       201:
 *         description: Child successfully added to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child added to activity session successfully"
 *       400:
 *         description: Child already registered for this activity session
 *       403:
 *         description: Not authorized to add this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */
// Add child to an activity
router.post('/child/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId } = req.body;

        if (!childId) {
            return res.status(400).json({ message: "Child ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Check if user is parent of the child
        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: req.user!.userId,
                childId: childId
            }
        });

        if (!parentChild) {
            return res.status(403).json({ message: "You are not authorized to add this child to the activity" });
        }

        // Check if child is already registered for this activity session
        const existingRegistration = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (existingRegistration) {
            return res.status(400).json({ message: "Child is already registered for this activity session" });
        }

        // Add child to activity session
        await AppDataSource.getRepository(ChildActivitySession).insert({
            childId: childId,
            activitySessionId: activitySessionId
        });

        return res.status(201).json({ message: "Child added to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


/**
 * @swagger
 * /activity-session/child/{id}:
 *   delete:
 *     summary: Remove child from an activity session
 *     description: Removes a child from a specific activity session. Parent can only remove their own children.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             childId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Child successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child removed from activity session successfully"
 *       400:
 *         description: Child not registered for this activity session
 *       403:
 *         description: Not authorized to remove this child
 *       404:
 *         description: Activity session or child not found
 *       500:
 *         description: Internal server error
 */
// Remove child from an activity
router.delete('/child/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { childId } = req.body;

        if (!childId) {
            return res.status(400).json({ message: "Child ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Check if user is parent of the child
        const parentChild = await AppDataSource.getRepository(ParentChild).findOne({
            where: {
                parentId: req.user!.userId,
                childId: childId
            }
        });

        if (!parentChild) {
            return res.status(403).json({ message: "You are not authorized to remove this child from the activity" });
        }

        // Check if child is registered for this activity session
        const existingRegistration = await AppDataSource.getRepository(ChildActivitySession).findOne({
            where: {
                childId: childId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingRegistration) {
            return res.status(400).json({ message: "Child is not registered for this activity session" });
        }

        // Remove child from activity session
        await AppDataSource.getRepository(ChildActivitySession).delete({
            childId: childId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Child removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});




/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   get:
 *     summary: Get all instructors from a specific activity session
 *     description: Returns a list of all instructor activity sessions for a specific activity session ID
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     responses:
 *       200:
 *         description: List of instructor activity sessions for the specified activity
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   assignedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-05T14:19:46.908Z"
 *                   instructor:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *                       name:
 *                         type: string
 *                         example: "João Silva"
 *                       email:
 *                         type: string
 *                         example: "joao.silva@cmbraga.pt"
 *                       phone:
 *                         type: string
 *                         example: "+351 925 678 901"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-05T14:22:01.592Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity not found"
 */
// Get all instructors from an activity
router.get('/instructor/:id', async (req: Request, res: Response) => {
    const activityId = req.params.id;
    
    const activityInfo = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: activityId
        },
        relations: {
            instructorActivitySessions: {
                instructor: true
            }
        },
        select: {
            instructorActivitySessions: {
                assignedAt: true,
                instructor: true
            }
        }
    });

    if (!activityInfo){
        return res.status(404).json({ message: "Activity not found" })
    }

    return res.status(200).json(activityInfo?.instructorActivitySessions);
});


/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   post:
 *     summary: Assign instructor to an activity session
 *     description: Assigns an instructor to a specific activity session. Only admins can assign instructors.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       201:
 *         description: Instructor successfully assigned to activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor assigned to activity session successfully"
 *       400:
 *         description: Instructor already assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Assign instructor to an activity
router.post('/instructor/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Check if instructor is already assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Instructor is already assigned to this activity session" });
        }

        // Assign instructor to activity session
        await AppDataSource.getRepository(InstructorActivitySession).insert({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });

        return res.status(201).json({ message: "Instructor assigned to activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});


/**
 * @swagger
 * /activity-session/instructor/{id}:
 *   delete:
 *     summary: Remove instructor from an activity session
 *     description: Removes an instructor from a specific activity session. Only admins can remove instructors.
 *     tags:
 *       - Activity Session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c56ad528-3522-4557-8b34-a787a50900b7"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - instructorId
 *             properties:
 *               instructorId:
 *                 type: string
 *                 example: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *           example:
 *             instructorId: "1bee5237-02ea-4f5c-83f3-bfe6e5a19756"
 *     responses:
 *       200:
 *         description: Instructor successfully removed from activity session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Instructor removed from activity session successfully"
 *       400:
 *         description: Instructor not assigned to this activity session
 *       404:
 *         description: Activity session or instructor not found
 *       500:
 *         description: Internal server error
 */
// Remove instructor from an activity
router.delete('/instructor/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const { instructorId } = req.body;

        if (!instructorId) {
            return res.status(400).json({ message: "Instructor ID is required" });
        }

        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        });
        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        const instructor = await AppDataSource.getRepository(Instructor).findOne({
            where: { id: instructorId }
        });
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Check if instructor is assigned to this activity session
        const existingAssignment = await AppDataSource.getRepository(InstructorActivitySession).findOne({
            where: {
                instructorId: instructorId,
                activitySessionId: activitySessionId
            }
        });
        if (!existingAssignment) {
            return res.status(400).json({ message: "Instructor is not assigned to this activity session" });
        }

        // Remove instructor from activity session
        await AppDataSource.getRepository(InstructorActivitySession).delete({
            instructorId: instructorId,
            activitySessionId: activitySessionId
        });

        return res.status(200).json({ message: "Instructor removed from activity session successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
});






/**
 * @swagger
 * /activity-session:
 *   get:
 *     summary: Get all activity sessions
 *     description: Returns a list of all activity sessions
 *     tags:
 *       - Activity Session
 *     responses:
 *       200:
 *         description: List of activity sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   type:
 *                     type: string
 *                     enum: [pedibus, ciclo_expresso]
 *                     example: "pedibus"
 *                   scheduledAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T08:00:00.000Z"
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T08:05:00.000Z"
 *                   finishedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T09:00:00.000Z"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    const allSessions = await AppDataSource.getRepository(ActivitySession).find();
    return res.status(200).json(allSessions);
});

/**
 * @swagger
 * /activity-session/{id}:
 *   get:
 *     summary: Get activity session by ID
 *     description: Returns a single activity session by its ID
 *     tags:
 *       - Activity Session
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
 *         description: Activity session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 type:
 *                   type: string
 *                   enum: [pedibus, ciclo_expresso]
 *                   example: "ciclo_expresso"
 *                 scheduledAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T08:00:00.000Z"
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-20T08:05:00.000Z"
 *                 finishedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    const sessionId = req.params.id;

    const session = await AppDataSource.getRepository(ActivitySession).findOne({
        where: {
            id: sessionId
        }
    });

    if (!session){
        return res.status(404).json({ message: "Session not found" })
    }

    return res.status(200).json(session);
});

/**
 * @swagger
 * /activity-session:
 *   post:
 *     summary: Create a new activity session
 *     description: Creates a new activity session (Pedibus or Ciclo Expresso)
 *     tags:
 *       - Activity Session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - scheduledAt
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "pedibus"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T08:00:00.000Z"
 *           example:
 *             type: "pedibus"
 *             scheduledAt: "2024-01-25T08:00:00.000Z"
 *     responses:
 *       201:
 *         description: Activity session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session created successfully"
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateActivitySessionSchema.parse(req.body);
    
    await AppDataSource.getRepository(ActivitySession).insert(validatedData);
            
    return res.status(201).json({message: "Session created successfully"});

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues
      });
    }

    console.error(error);
    return res.status(500).json({ message: error });
  }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   put:
 *     summary: Update an activity session
 *     description: Updates an existing activity session
 *     tags:
 *       - Activity Session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Activity Session ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pedibus, ciclo_expresso]
 *                 example: "ciclo_expresso"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-25T09:00:00.000Z"
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2024-01-25T09:05:00.000Z"
 *               finishedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2024-01-25T10:00:00.000Z"
 *           example:
 *             startedAt: "2024-01-25T08:05:00.000Z"
 *     responses:
 *       200:
 *         description: Activity session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Activity session not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const activitySessionId = req.params.id;
        const validatedData = UpdateActivitySessionSchema.parse(req.body);
        
        const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: activitySessionId }
        })

        if (!activitySession) {
            return res.status(404).json({ message: "Activity session not found" });
        }

        // Update activity session with updatedAt timestamp
        await AppDataSource.getRepository(ActivitySession).update(activitySession.id, {
            ...validatedData,
            updatedAt: new Date()
        })

        return res.status(200).json({ message: "Activity session updated successfully" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error });
    }
});

/**
 * @swagger
 * /activity-session/{id}:
 *   delete:
 *     summary: Delete an activity session
 *     description: Deletes an activity session by ID
 *     tags:
 *       - Activity Session
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
 *         description: Activity session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Activity session deleted successfully"
 *       404:
 *         description: Activity session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found"
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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const sessionId = req.params.id;
        
        const session = await AppDataSource.getRepository(ActivitySession).findOne({
            where: { id: sessionId }
        })

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }


        await AppDataSource.getRepository(ActivitySession).delete(session.id);
        
        return res.status(200).json({ message: "Session deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});








export default router;
