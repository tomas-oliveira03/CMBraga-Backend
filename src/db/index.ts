import { envs } from "@/config";
import _Appdatasource from "./data-source";

export async function initializeDatabase(): Promise<void> {
	await _Appdatasource.initialize();

	const sqlInMemory = await _Appdatasource.driver.createSchemaBuilder().log();
	for (const query of sqlInMemory.upQueries) {
		const sqlString = `${query.query.trim()};`;
		if (envs.isLocal) {
			console.error(sqlString);
		} else {
			console.log('Database change not reflected in migrations', { migration: sqlString });
		}
	}
}

export const AppDataSource = _Appdatasource;