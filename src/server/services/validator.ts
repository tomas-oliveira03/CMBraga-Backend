import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { HealthProfessional } from "@/db/entities/HealthProfessional";
import { Instructor } from "@/db/entities/Instructor";
import { Parent } from "@/db/entities/Parent";

export async function checkIfEmailExists(email: string): Promise<boolean>{
    
    const parent = await AppDataSource.getRepository(Parent).findOne({ where: { email: email } })
    if (parent) {
        return true
    }

    const instructor = await AppDataSource.getRepository(Instructor).findOne({ where: { email: email } })
    if (instructor) {
        return true
    }

    const admin = await AppDataSource.getRepository(Admin).findOne({ where: { email: email } })
    if (admin) {
        return true
    }

    const healthProfessional = await AppDataSource.getRepository(HealthProfessional).findOne({ where: { email: email } })
    if (healthProfessional) {
        return true
    }

    return false
}


