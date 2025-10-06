import { z } from "zod";

export const IssueSchema = z.object({
    id: z.string(),
    description: z.string(),
    images: z.array(z.string()),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable(),
    instructorId: z.string(),
    activitySessionId: z.string(),
    resolvedAt: z.coerce.date().nullable()
});

export const CreateIssueSchema = IssueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    resolvedAt: true
});

export const UpdateIssueSchema = IssueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    instructorId: true,
    activitySessionId: true
}).partial();

export type Issue = z.infer<typeof IssueSchema>;
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
