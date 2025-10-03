export enum ActivityType {
	PEDIBUS = 'pedibus',
	CICLO_EXPRESSO = 'ciclo_expresso'
}

export enum ChildGender {
	MALE = 'male',
	FEMALE = 'female'
}

// MOCKED DATA
export type ChildHealthProblems = {
	allergies?: string[];
	chronicDiseases?: string[];
	surgeries?: { type: string; year: number }[];
};

export enum ChildStationType {
    IN = 'in',  // Child checked in at the station
    OUT = 'out' // Child checked out at the school
}

export enum StationType {
	REGULAR = 'regular',
	SCHOOL = 'school'
}

export enum HealthProfessionalSpecialty {
    PEDIATRICHIAN = 'pediatrician',
    NUTRITIONIST = 'nutritionist',
    GENERAL_PRACTITIONER = 'general_practitioner'
}

// NON DB TYPES

export enum UserRole {
    ADMIN = 'admin',
    INSTRUCTOR = 'instructor', 
    PARENT = 'parent',
    HEALTH_PROFESSIONAL = 'health_professional'
}