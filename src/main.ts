import { AppDataSource, initializeDatabase } from "./db";

async function main(){
    await initializeDatabase()
       
}

main()