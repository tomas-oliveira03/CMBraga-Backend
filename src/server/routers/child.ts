import { AppDataSource } from "@/db";
import { Child } from "@/db/entities/Child";
import express, { Request, Response } from "express";
import { UpdateChildSchema } from "../schemas/child";
import { z } from "zod";
import { Station } from "@/db/entities/Station";
import { StationType } from "@/helpers/types";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { updateProfilePicture } from "../services/user";
import { ChildHistory } from "@/db/entities/ChildHistory";
import { differenceInYears } from "date-fns";
import { ParentChild } from "@/db/entities/ParentChild";
import { Parent } from "@/db/entities/Parent";
import { In } from "typeorm";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { Feedback } from "@/db/entities/Feedback";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    try {
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
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
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
 *                   dropOffStationId:
 *                     type: string
 *                     example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                     description: "School station ID where the child is dropped off"
 *                   profilePictureURL:
 *                     type: string
 *                     example: "https://storage.example.com/profiles/child-1.jpg"
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
    try {
        const allChildren = await AppDataSource.getRepository(Child).find();
        return res.status(200).json(allChildren);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
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
 *                 dropOffStationId:
 *                   type: string
 *                   example: "s1t2a3t4-i5o6-7890-abcd-ef1234567890"
 *                   description: "School station ID where the child is dropped off"
 *                 profilePictureURL:
 *                   type: string
 *                   example: "https://storage.example.com/profiles/child-2.jpg"
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
    try {
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
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

/**
 * @swagger
 * /child/{id}:
 *   put:
 *     summary: Update a child
 *     description: Updates an existing child and records height/weight changes in history. Can add one additional parent (max 2 parents total) or remove a parent (with validations).
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
 *         multipart/form-data:
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
 *                 type: string
 *                 description: "JSON string of health problems object"
 *                 example: '{"allergies":["gluten","shellfish"],"chronicDiseases":[],"surgeries":[]}'

 *               heightCentimeters:
 *                 type: number
 *                 example: 135
 *                 description: "Child's height in centimeters (records history if provided)"
 *               weightKilograms:
 *                 type: number
 *                 example: 32
 *                 description: "Child's weight in kilograms (records history if provided)"
 *               dropOffStationId:
 *                 type: string
 *                 example: "station-uuid-2"
 *                 description: "School station ID where the child will be dropped off"
 *               parentId:
 *                 type: string
 *                 description: "Parent ID to add (max 2 parents total)"
 *                 example: "parent-uuid-2"
 *               removeParentId:
 *                 type: string
 *                 description: "Parent ID to remove (requires at least 1 other parent, no activities, no feedback)"
 *                 example: "parent-uuid-1"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "Profile picture image file (JPEG, JPG, PNG, WEBP)"
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
 *               heightCentimeters:
 *                 type: number
 *                 example: 135
 *               weightKilograms:
 *                 type: number
 *                 example: 32
 *               dropOffStationId:
 *                 type: string
 *                 example: "station-uuid-2"
 *               parentId:
 *                 type: string
 *                 example: "parent-uuid-2"
 *               removeParentId:
 *                 type: string
 *                 example: "parent-uuid-1"
 *           example:
 *             removeParentId: "parent-uuid-1"
 *     responses:
 *       200:
 *         description: Child updated successfully
 *       400:
 *         description: Validation error or cannot remove parent (only parent, has activities, or has feedback)
 *       404:
 *         description: Child not found or parent not associated
 *       500:
 *         description: Internal server error
 */
router.put('/:id', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const validatedData = UpdateChildSchema.parse(req.body);
        
        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId }
        })
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        if(validatedData.dropOffStationId){
            const station = await AppDataSource.getRepository(Station).findOne({
                where: {
                    id: validatedData.dropOffStationId,
                    type: StationType.SCHOOL
                }
            })
            if(!station){
                return res.status(404).json({message: "Station does not exist or it isn't labeled as school"});
            }
        }

        const { parentId, removeParentId, dropOffStationId, ...childDataFields } = validatedData;
        const childData = { 
            ...childDataFields,
            profilePictureURL: child.profilePictureURL
        }
        
        if (req.file){
            if (!isValidImageFile(req.file)){
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            childData.profilePictureURL = await updateProfilePicture(child.profilePictureURL, req.file.buffer);
        }
        
        if(parentId){
            const parent = await AppDataSource.getRepository(Parent).findOne({
                where: { id: parentId }
            })
            
            if(!parent){
                return res.status(404).json({message: "Parent doesn't exist"});
            }

            const currentParentsCount = await AppDataSource.getRepository(ParentChild).count({
                where: { childId: childId }
            });

            if(currentParentsCount >= 2){
                return res.status(400).json({message: "Child already has 2 parents associated"});
            }

            const existingAssociation = await AppDataSource.getRepository(ParentChild).findOne({
                where: {
                    childId: childId,
                    parentId: parentId
                }
            });

            if(existingAssociation){
                return res.status(400).json({message: "Parent is already associated with this child"});
            }
        }

        if(removeParentId){
            const parentAssociation = await AppDataSource.getRepository(ParentChild).findOne({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if(!parentAssociation){
                return res.status(404).json({message: "Parent is not associated with this child"});
            }

            const parentsNumber = await AppDataSource.getRepository(ParentChild).count({
                where: { childId: childId }
            });

            if(parentsNumber === 1){
                return res.status(400).json({message: "Cannot remove parent: child must have at least one parent"});
            }

            const activitiesNumber = await AppDataSource.getRepository(ChildActivitySession).count({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if(activitiesNumber > 0){
                return res.status(400).json({message: "Cannot remove parent: child has activities registered by this parent"});
            }

            const feedbackNumber = await AppDataSource.getRepository(Feedback).count({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if(feedbackNumber > 0){
                return res.status(400).json({message: "Cannot remove parent: parent has submitted feedback for this child"});
            }
        }

        const updatedAt = new Date()
        await AppDataSource.transaction(async tx => {
            await tx.getRepository(Child).update(child.id, {
                ...childData,
                updatedAt: updatedAt
            })

            const age = differenceInYears(updatedAt, child.dateOfBirth);

            if(childData.heightCentimeters || childData.weightKilograms){
                await tx.getRepository(ChildHistory).insert({
                    childId: childId,
                    heightCentimeters: childData.heightCentimeters || child.heightCentimeters,
                    weightKilograms: childData.weightKilograms || child.weightKilograms,
                    age: age
                })
            }

            if(parentId){
                await tx.getRepository(ParentChild).insert({
                    parentId: parentId,
                    childId: childId
                })
            }

            if(removeParentId){
                await tx.getRepository(ParentChild).delete({
                    parentId: removeParentId,
                    childId: childId
                })
            }
        })
        
        return res.status(200).json({ 
            id: childId,
            name: childData.name,
            profilePictureURL: req.file ? childData.profilePictureURL : undefined,
            updatedAt: updatedAt
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                message: "Validation error", 
                errors: error.issues 
            });
        }
        
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
