import { AppDataSource } from "@/db";
import express, { Request, Response } from "express";
import { SurveyType, UserRole } from "@/helpers/types";
import { authenticate, authorize } from "../middleware/auth";
import { kidsQuestionaryIntro, kidsQuestions, parentsQuestionaryIntro, parentsQuestions, numberOfQuestions, QuestionnaireSurveyAnswers } from "@/helpers/survey-questions";
import { Survey } from "@/db/entities/Survey";
import { Child } from "@/db/entities/Child";
import { MoreThan } from "typeorm";

const router = express.Router();

router.get('/document', authenticate, authorize(UserRole.PARENT, UserRole.ADMIN, UserRole.HEALTH_PROFESSIONAL), async (req: Request, res: Response) => {
    try {
        const surveyType = req.query.type;
        if (!surveyType || (surveyType !== SurveyType.CHILD && surveyType !== SurveyType.PARENT)) {
            return res.status(400).json({ message: 'Invalid or missing surveyType parameter' });
        }

        let surveyToDisplay = {
            intro: kidsQuestionaryIntro,
            data: kidsQuestions
        }
        if (surveyType === SurveyType.PARENT) {
            surveyToDisplay = {
                intro: parentsQuestionaryIntro,
                data: parentsQuestions
            }
        }

        return res.status(200).json(surveyToDisplay);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.PARENT, UserRole.ADMIN, UserRole.HEALTH_PROFESSIONAL), async (req: Request, res: Response) => {
    try {
        const survey = await AppDataSource.getRepository(Survey).findOne({
            where: {
                id: req.params.id
            },
            relations: {
                parent: {
                    parentChildren: true
                },
                child: {
                    parentChildren: true
                }
            }
        });
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (req.user!.role === UserRole.PARENT && (survey.parentId !== req.user!.userId || !survey.child.parentChildren.find(pc => pc.parentId === req.user!.userId))) {
            return res.status(403).json({ message: 'You do not have permission to view this survey' });
        }

        // Get the appropriate questionnaire based on survey type
        const questionnaire = survey.type === SurveyType.CHILD ? kidsQuestions : parentsQuestions;
        
        // Map answers to QuestionnaireSurveyAnswers format
        const surveyToDisplay: QuestionnaireSurveyAnswers = questionnaire.map(section => ({
            section: section.section,
            data: section.data.map(dataItem => ({
                context: dataItem.context,
                data: dataItem.questions.map(questionObj => {
                    const questionNumber = Object.keys(questionObj)[0];
                    const questionText = questionObj[Number(questionNumber)]!;
                    const answerIndex = survey.answers.find(answer => Object.keys(answer)[0] === questionNumber)?.[Number(questionNumber)] || 0;
                    const answerText = dataItem.answerTypes[answerIndex - 1]!;
                    
                    return {
                        [Number(questionNumber)]: {
                            question: questionText,
                            answer: answerText
                        }
                    };
                }),
                answerTypes: dataItem.answerTypes
            }))
        }));
        
        return res.status(200).json(surveyToDisplay);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.post('/', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const { type: surveyType, data, childId } = req.body;

        if (!surveyType || (surveyType !== SurveyType.CHILD && surveyType !== SurveyType.PARENT)) {
            return res.status(400).json({ message: 'Invalid or missing surveyType parameter' });
        }

        if (!childId || typeof childId !== 'string') {
            return res.status(400).json({ message: 'Invalid or missing childId parameter' });
        }

        if (!Array.isArray(data)) {
            return res.status(400).json({ message: 'Data must be an array' });
        }
        if (data.length !== numberOfQuestions) {
            return res.status(400).json({ message: `Data must contain exactly ${numberOfQuestions} entries` });
        }

        // Validate each entry
        for (const entry of data) {
            if (typeof entry !== 'object' || entry === null) {
                return res.status(400).json({ message: 'Each entry must be an object' });
            }

            const keys = Object.keys(entry);
            if (keys.length !== 1) {
                return res.status(400).json({ message: 'Each entry must have exactly one key-value pair' });
            }

            const value = entry[keys[0]!];
            if (typeof value !== 'number' || value < 1 || value > 5 || !Number.isInteger(value)) {
                return res.status(400).json({ message: 'Each value must be an integer between 1 and 5' });
            }
        }

        const childExists = await AppDataSource.getRepository(Child).findOne({
            where: {
                id: childId
            },
            relations: {
                parentChildren: true
            }
        })

        if(!childExists){
            return res.status(404).json({ message: 'Child not found' });
        }

        const isParentOfChild = childExists.parentChildren.some(parentChild => parentChild.parentId === req.user!.userId);
        if(!isParentOfChild){
            return res.status(403).json({ message: 'You are not the parent of this child' });
        }

        const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
        const surveyExists = await AppDataSource.getRepository(Survey).findOne({
            where: {
                type: surveyType,
                parentId: req.user!.userId,
                childId: childId,
                submittedAt: MoreThan(new Date(Date.now() - WEEK_IN_MS))
            }
        });
        if (surveyExists) {
            return res.status(400).json({ message: 'Survey has already been submitted in the last week for this child' });
        }

        await AppDataSource.getRepository(Survey).insert({
            type: surveyType,
            parentId: req.user!.userId,
            childId: childId,
            answers: data
        });

        return res.status(200).json({ message: 'Survey submitted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


export default router;
