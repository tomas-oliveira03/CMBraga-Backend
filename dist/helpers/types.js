"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherType = exports.NotificationType = exports.TypeOfChat = exports.UserRole = exports.BadgeCriteria = exports.HealthProfessionalSpecialty = exports.StationType = exports.ChildStationType = exports.ChildGender = exports.ActivityMode = exports.ActivityType = void 0;
var ActivityType;
(function (ActivityType) {
    ActivityType["PEDIBUS"] = "pedibus";
    ActivityType["CICLO_EXPRESSO"] = "ciclo_expresso";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var ActivityMode;
(function (ActivityMode) {
    ActivityMode["WALK"] = "walk";
    ActivityMode["BIKE"] = "bike";
})(ActivityMode || (exports.ActivityMode = ActivityMode = {}));
var ChildGender;
(function (ChildGender) {
    ChildGender["MALE"] = "male";
    ChildGender["FEMALE"] = "female";
})(ChildGender || (exports.ChildGender = ChildGender = {}));
var ChildStationType;
(function (ChildStationType) {
    ChildStationType["IN"] = "in";
    ChildStationType["OUT"] = "out"; // Child checked out at the school
})(ChildStationType || (exports.ChildStationType = ChildStationType = {}));
var StationType;
(function (StationType) {
    StationType["REGULAR"] = "regular";
    StationType["SCHOOL"] = "school";
})(StationType || (exports.StationType = StationType = {}));
var HealthProfessionalSpecialty;
(function (HealthProfessionalSpecialty) {
    HealthProfessionalSpecialty["PEDIATRICHIAN"] = "pediatrician";
    HealthProfessionalSpecialty["NUTRITIONIST"] = "nutritionist";
    HealthProfessionalSpecialty["GENERAL_PRACTITIONER"] = "general_practitioner";
})(HealthProfessionalSpecialty || (exports.HealthProfessionalSpecialty = HealthProfessionalSpecialty = {}));
var BadgeCriteria;
(function (BadgeCriteria) {
    BadgeCriteria["STREAK"] = "streak";
    BadgeCriteria["DISTANCE"] = "distance";
    BadgeCriteria["CALORIES"] = "calories";
    BadgeCriteria["WEATHER"] = "weather";
    BadgeCriteria["POINTS"] = "points";
    BadgeCriteria["LEADERBOARD"] = "leaderboard";
    BadgeCriteria["SPECIAL"] = "special";
})(BadgeCriteria || (exports.BadgeCriteria = BadgeCriteria = {}));
// NON DB TYPES
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["INSTRUCTOR"] = "instructor";
    UserRole["PARENT"] = "parent";
    UserRole["HEALTH_PROFESSIONAL"] = "health_professional";
})(UserRole || (exports.UserRole = UserRole = {}));
var TypeOfChat;
(function (TypeOfChat) {
    TypeOfChat["GROUP_CHAT"] = "group_chat";
    TypeOfChat["INDIVIDUAL_CHAT"] = "individual_chat";
})(TypeOfChat || (exports.TypeOfChat = TypeOfChat = {}));
// CHAT
var NotificationType;
(function (NotificationType) {
    NotificationType["MESSAGE"] = "message";
    NotificationType["MEDICAL_REPORT"] = "medical_report";
    NotificationType["GENERAL"] = "general";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// Weather
var WeatherType;
(function (WeatherType) {
    WeatherType["Thunderstorm"] = "thunderstorm";
    WeatherType["Drizzle"] = "drizzle";
    WeatherType["Rain"] = "rain";
    WeatherType["Snow"] = "snow";
    WeatherType["Atmosphere"] = "atmosphere";
    WeatherType["Clear"] = "clear";
    WeatherType["Clouds"] = "clouds";
})(WeatherType || (exports.WeatherType = WeatherType = {}));
