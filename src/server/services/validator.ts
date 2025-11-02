import { AppDataSource } from "@/db";
import { User } from "@/db/entities/User";

export async function checkIfEmailExists(email: string): Promise<boolean>{
    const emailExists = await AppDataSource.getRepository(User).findOne({
        where: {
            id: email
        }
    })

    return emailExists !== null
}


