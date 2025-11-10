import { z } from "zod";

export const FeedbackSchema = z.object({
    id: z.string(),
    evaluation1: z.number().int().min(1).max(5),
    evaluation2: z.number().int().min(1).max(5),
    evaluation3: z.number().int().min(1).max(5),
    evaluation4: z.number().int().min(1).max(5),
    evaluation5: z.number().int().min(1).max(5),
    textFeedback: z.string(),
    overallRating: z.number().int().min(1).max(5),
    activitySessionId: z.string(),
    childId: z.string(),
    submitedAt: z.date()
});

export const CreateFeedbackSchema = FeedbackSchema.omit({
    id: true,
    submitedAt: true
});

export type Feedback = z.infer<typeof FeedbackSchema>;
export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;
