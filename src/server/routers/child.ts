import { AppDataSource } from "@/db";
import { Child } from "@/db/entities/Child";
import { ParentChild } from "@/db/entities/ParentChild";
import express, { Request, Response } from "express";
import { CreateChildSchema, UpdateChildSchema } from "../schemas/child";
import { z } from "zod";
import { Parent } from "@/db/entities/Parent";
import { In } from "typeorm";
import { validate } from "@/lib/validator";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { Station } from "@/db/entities/Station";
import { StationType } from "@/helpers/types";

const router = express.Router();

/**
 * @swagger
 * /child/activities/{id}:
 *   get:
 *     summary: Get activities for a child
 *     description: Returns the list of activity registrations for a given child, including the registration timestamp and the related activity session details.
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: List of child activity registrations
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
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   activitySession:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "b1c2d3e4-f5a6-7890-abcd-111213141516"
 *                       startAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-20T09:00:00.000Z"
 *                       endAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-20T10:00:00.000Z"
 *                       name:
 *                         type: string
 *                         example: "Atividade de Expressão" 
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child not found"
 */
router.get('/activities/:id', async (req: Request, res: Response) => {
    const childId = req.params.id;
    const child = await AppDataSource.getRepository(Child).findOne({
        where: { id: childId }, 
        relations: {
            childActivitySessions: { 
                activitySession: true
            }
        },
        select: {
            childActivitySessions:{
                registeredAt: true,
                activitySession: true
            }
        }
    })
    
    if(!child){
        return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json(child.childActivitySessions)
})



/**
 * @swagger
 * /child:
 *   get:
 *     summary: Get all children
 *     description: Returns a list of all children
 *     tags:
 *       - Child
 *     responses:
 *       200:
 *         description: List of children
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
 *                   name:
 *                     type: string
 *                     example: "João Silva"
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                     example: "male"
 *                   school:
 *                     type: string
 *                     example: "Escola Básica de Braga"
 *                   schoolGrade:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 12
 *                     example: 4
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: "2015-05-20"
 *                   healthProblems:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       allergies:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["peanuts", "lactose"]
 *                       chronicDiseases:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["asthma"]
 *                       surgeries:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                             year:
 *                               type: number
 *                         example: [{"type": "appendectomy", "year": 2020}]
 *                   stationId:
 *                     type: string
 *                     example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                     description: "School station ID where the child is dropped off"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                     example: "2024-01-20T14:45:30.000Z"
 */
router.get('/', async (req: Request, res: Response) => {
    const allChildren = await AppDataSource.getRepository(Child).find();
    return res.status(200).json(allChildren);
});

/**
 * @swagger
 * /child/{id}:
 *   get:
 *     summary: Get child by ID
 *     description: Returns a single child by their ID
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: Child found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 name:
 *                   type: string
 *                   example: "Maria Santos"
 *                 gender:
 *                   type: string
 *                   enum: [male, female]
 *                   example: "female"
 *                 school:
 *                   type: string
 *                   example: "Escola Básica de Braga"
 *                 schoolGrade:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 12
 *                   example: 3
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                   example: "2016-03-10"
 *                 healthProblems:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     chronicDiseases:
 *                       type: array
 *                       items:
 *                         type: string
 *                     surgeries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           year:
 *                             type: number
 *                 stationId:
 *                   type: string
 *                   example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                   description: "School station ID where the child is dropped off"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-10T09:15:22.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child not found"
 */
router.get('/:id', async (req: Request, res: Response) => {
    const childId = req.params.id;

    const child = await AppDataSource.getRepository(Child).findOne({
        where: {
            id: childId
        }
    });

    if (!child){
        return res.status(404).json({ message: "Child not found" })
    }

    return res.status(200).json(child);
});

/**
 * @swagger
 * /child:
 *   post:
 *     summary: Create a new child
 *     description: Creates a new child and associates them with parent(s) and a school station
 *     tags:
 *       - Child
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - gender
 *               - school
 *               - schoolGrade
 *               - dateOfBirth
 *               - parentIds
 *               - stationId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Carlos Pereira"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *               school:
 *                 type: string
 *                 example: "Escola Básica de Braga"
 *               schoolGrade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 5
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-08-25"
 *               healthProblems:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["peanuts"]
 *                   chronicDiseases:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["asthma"]
 *                   surgeries:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         year:
 *                           type: number
 *                     example: [{"type": "tonsillectomy", "year": 2022}]
 *               parentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["parent-uuid-1", "parent-uuid-2"]
 *               stationId:
 *                 type: string
 *                 example: "station-uuid-1"
 *                 description: "School station ID where the child will be dropped off"
 *           example:
 *             name: "Ana Costa"
 *             gender: "female"
 *             school: "Escola Básica de Braga"
 *             schoolGrade: 2
 *             dateOfBirth: "2016-02-14"
 *             healthProblems:
 *               allergies: ["lactose"]
 *               chronicDiseases: []
 *               surgeries: []
 *             parentIds: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
 *             stationId: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *     responses:
 *       201:
 *         description: Child created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child created successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: At least one parent doesn't exist or station does not exist/isn't a school
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateChildSchema.parse(req.body);
        
    const parents = await AppDataSource.getRepository(Parent).find({
        where: {
            id: In (validatedData.parentIds)
        }
    })
    
    if(parents.length !== validatedData.parentIds.length){
        return res.status(404).json({message: "At least one parent doesn't exist"});
    }

    const station = await AppDataSource.getRepository(Station).findOne({
        where: {
            id: validatedData.stationId,
            type: StationType.SCHOOL
        }
    })
    if(!station){
        return res.status(404).json({message: "Station does not exist or it isn't labeled as school"});
    }

    
    const child = await AppDataSource.getRepository(Child).insert(validatedData);
    const childId = child.identifiers[0]?.id;

    if(!childId){
        throw new Error("Error inserting child");
    }

    const parentChildConnector = parents.map(parent => ({
        parentId: parent.id,
        childId: childId
    }));

    await AppDataSource.getRepository(ParentChild).insert(parentChildConnector);

    return res.status(201).json({message: "Child created successfully"});

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
 * /child/{id}:
 *   put:
 *     summary: Update a child
 *     description: Updates an existing child
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 example: "Pedro Oliveira"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "male"
 *               school:
 *                 type: string
 *                 example: "Escola Secundária de Braga"
 *               schoolGrade:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 6
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2015-11-30"
 *               healthProblems:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                   chronicDiseases:
 *                     type: array
 *                     items:
 *                       type: string
 *                   surgeries:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         year:
 *                           type: number
 *               stationId:
 *                 type: string
 *                 example: "station-uuid-2"
 *                 description: "School station ID where the child will be dropped off"
 *           example:
 *             name: "Sofia Mendes"
 *             gender: "female"
 *             school: "Escola Básica Central"
 *             schoolGrade: 1
 *             healthProblems:
 *               allergies: ["gluten", "shellfish"]
 *             stationId: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Child updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child updated successfully"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Child not found or station does not exist/isn't a school
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const validatedData = UpdateChildSchema.parse(req.body);
        
        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        })

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        if(validatedData.stationId){
            const station = await AppDataSource.getRepository(Station).findOne({
                where: {
                    id: validatedData.stationId,
                    type: StationType.SCHOOL
                }
            })
            if(!station){
                return res.status(404).json({message: "Station does not exist or it isn't labeled as school"});
            }
        }

        // Update child with updatedAt timestamp
        await AppDataSource.getRepository(Child).update(child.id, {
            ...validatedData,
            updatedAt: new Date()
        })
        
        return res.status(200).json({ message: "Child updated successfully" });

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
 * /child/{id}:
 *   delete:
 *     summary: Delete a child
 *     description: Deletes a child by ID and removes all parent-child associations
 *     tags:
 *       - Child
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         description: Child ID (UUID)
 *     responses:
 *       200:
 *         description: Child deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child deleted successfully"
 *       404:
 *         description: Child not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Child not found"
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
        const childId = req.params.id;
        
        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        })

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        await AppDataSource.getRepository(ParentChild).delete({childId: childId})

        await AppDataSource.getRepository(Child).delete(child.id);
        
        return res.status(200).json({ message: "Child deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
});



export default router;
