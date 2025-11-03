export enum ActivityType {
	PEDIBUS = 'pedibus',
	CICLO_EXPRESSO = 'ciclo_expresso'
}

export enum ActivityMode {
	WALK = 'walk',
	BIKE = 'bike'
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

export enum BadgeCriteria {
    STREAK = 'streak',
    DISTANCE = 'distance',
    CALORIES = 'calories',
    WEATHER = 'weather',
    POINTS = 'points',
    LEADERBOARD = 'leaderboard',
    PARTICIPATION = 'participation',
    SPECIAL = 'special'
}

// NON DB TYPES

export enum UserRole {
    ADMIN = 'admin',
    INSTRUCTOR = 'instructor', 
    PARENT = 'parent',
    HEALTH_PROFESSIONAL = 'health_professional'
}

export enum TypeOfChat {
    GROUP_CHAT = 'group_chat',
    INDIVIDUAL_CHAT = 'individual_chat',
    GENERAL_CHAT = 'general_chat'
}


// CHAT

export enum NotificationType {
    MESSAGE = 'message',
    MEDICAL_REPORT = 'medical_report',
    GENERAL = 'general'
}


// Weather

export enum WeatherType {
  Thunderstorm = "thunderstorm",
  Drizzle = "drizzle",           
  Rain = "rain",                 
  Snow = "snow",                
  Atmosphere = "atmosphere", 
  Clear = "clear",              
  Clouds = "clouds"           
}

export enum ActivitySessionStatus {
    FUTURE = 'future',
    ONGOING = 'ongoing',
    ENDED = 'ended'
}

export enum IssueStatus {
    OPEN = 'open',
    SOLVED = 'solved'
}


// Route
export interface RoutePoint {
    lat: number;
    lon: number;
}


// Activity Types
export enum ActivityLinkType {
    SINGLE = 'single',
    BUNDLE = 'bundle'
}

export enum ActivityStatusType {
    ONGOING = 'ongoing',
    PREVIOUS = 'previous',
    UPCOMING = 'upcoming'
}