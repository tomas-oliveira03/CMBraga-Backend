import { UserRole } from "@/helpers/types";
import { CreateHealthProfessionalInput } from "../schemas/healthProfessional";
import { CreateParentInput } from "../schemas/parent";
import { CreateInstructorInput } from "../schemas/instructor";
import { CreateAdminInput } from "../schemas/admin";
import { checkIfEmailExists } from "./validator";
import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";
import informationHash from "@/lib/information-hash";
import { Admin } from "@/db/entities/Admin";
import { Instructor } from "@/db/entities/Instructor";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { Parent } from "@/db/entities/Parent";
import { selectRandomDefaultProfilePicture } from "@/helpers/storage";

type UserDataMap = {
  [UserRole.ADMIN]: CreateAdminInput;
  [UserRole.INSTRUCTOR]: CreateInstructorInput;
  [UserRole.PARENT]: CreateParentInput;
  [UserRole.HEALTH_PROFESSIONAL]: CreateHealthProfessionalInput;
};

export async function registerUser<T extends UserRole>(
    clientType: T,
    userData: UserDataMap[T]
) {
    const emailExists = await checkIfEmailExists(userData.email);
    if (emailExists) {
        return false;
    }

    const dateNow = new Date()
    const profilePictureURL = selectRandomDefaultProfilePicture()

    await AppDataSource.transaction(async (tx) => {
        switch (clientType) {
            case UserRole.ADMIN: {
                const admin = await tx.getRepository(Admin).insert({
                    ...userData,
                    updatedAt: dateNow,
                    activatedAt: dateNow,
                    profilePictureURL: profilePictureURL,
                    password: informationHash.encrypt("Person23!"),
                });
                const adminId = admin.identifiers[0]?.id;

                await tx.getRepository(User).insert({
                    id: userData.email,
                    name: userData.name,
                    adminId: adminId,
                });
                break;
            }

            case UserRole.INSTRUCTOR: {
                const instructor = await tx.getRepository(Instructor).insert({
                    ...userData,
                    updatedAt: dateNow,
                    activatedAt: dateNow,
                    profilePictureURL: profilePictureURL,
                    password: informationHash.encrypt("Person23!"),
                });
                const instructorId = instructor.identifiers[0]?.id

                await tx.getRepository(User).insert({
                    id: userData.email,
                    name: userData.name,
                    instructorId: instructorId,
                });
                break;
            }

            case UserRole.PARENT: {
                const parent = await tx.getRepository(Parent).insert({
                    ...userData,
                    updatedAt: dateNow,
                    activatedAt: dateNow,
                    profilePictureURL: profilePictureURL,
                    password: informationHash.encrypt("Person23!"),
                });
                const parentId = parent.identifiers[0]?.id
                
                await tx.getRepository(User).insert({
                    id: userData.email,
                    name: userData.name,
                    parentId: parentId
                });
                break;
            }

            case UserRole.HEALTH_PROFESSIONAL: {
                const healthProfessional = await tx.getRepository(HealthProfessional).insert({
                    ...userData,
                    updatedAt: dateNow,
                    activatedAt: dateNow,
                    profilePictureURL: profilePictureURL,
                    password: informationHash.encrypt("Person23!"),
                });
                const healthProfessionalId = healthProfessional.identifiers[0]?.id
                
                await tx.getRepository(User).insert({
                    id: userData.email,
                    name: userData.name,
                    healthProfessionalId: healthProfessionalId
                });
                break;
            }
        }

        // await createPassword(validatedData.email, validatedData.name);
    });

    return true
}



