import { UserRole } from "@/helpers/types";
import z from "zod";
import { CreateAdminSchema } from "./admin";
import { CreateParentSchema } from "./parent";
import { CreateInstructorSchema } from "./instructor";
import { CreateHealthProfessionalSchema } from "./healthProfessional";

export const LoginSchema = z.object({
    email: z.string(),
    password: z.string()
});

export const RegisterSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(UserRole.ADMIN)
    }).merge(CreateAdminSchema),
    
    z.object({
        type: z.literal(UserRole.PARENT)
    }).merge(CreateParentSchema),
    
    z.object({
        type: z.literal(UserRole.INSTRUCTOR)
    }).merge(CreateInstructorSchema),
    
    z.object({
        type: z.literal(UserRole.HEALTH_PROFESSIONAL)
    }).merge(CreateHealthProfessionalSchema)
]);

export type RegisterInput = z.infer<typeof RegisterSchema>;
