import { AppDataSource } from "@/db";
import { Admin } from "@/db/entities/Admin";
import { selectRandomDefaultProfilePicture } from "@/helpers/storage";
import { createPasswordEmail } from "@/server/services/email";

async function databaseAlreadyHydrated(): Promise<boolean> {
    const adminCount = await AppDataSource.getRepository(Admin).count();
    return adminCount > 0;
}


async function createNewAdminAccount(email: string) {
    try {
        const name = "Admin";

        await AppDataSource.getRepository(Admin).insert({
            name: name,
            email: email,
            profilePictureURL: selectRandomDefaultProfilePicture(),
            phone: "000000000",
        })

        await createPasswordEmail(email, name);
    }
    catch (error) {
        console.error("Error creating admin account:", error);
    }
}


async function runHydration(email: string) {
    try {
        await AppDataSource.initialize();

        const alreadyHydrated = await databaseAlreadyHydrated();
        if (alreadyHydrated) {
            console.log("Database already hydrated. Exiting hydration script...");
            return;
        }

        await createNewAdminAccount(email);
    }
    catch (error) {
        console.error("Error during Data Source initialization:", error);
        return;
    }
}


const email = process.argv[2];

if (!email) {
    console.error(
        "Missing required argument: email\n" +
        "Usage: npm run prod:hydration <email>\n" +
        "Example: npm run prod:hydration admin@example.com"
    );
    process.exit(1);
}
runHydration(email).catch((e) => {
    console.error(e);
    process.exit(1);
});
