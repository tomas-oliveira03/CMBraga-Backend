import express from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import instructorRouter from "./instructor";
import parentRouter from "./parent";
import childRouter from "./child";
import healthProfessionalRouter from "./healthProfessional";
import medicalReportRouter from "./medicalReport";
import communicationRouter from "./communication";
import authRouter from "./auth";
import issueRouter from "./issue";
import stationRouter from "./station";
import dashboardRouter from "./dashboard";
import userRouter from "./user";
import activitySessionRouter from "./activitySession";
import activitySessionStationRouter from "./activitySession/station"
import activitySessionStationChild from "./activitySession/child"
import activitySessionStationInstructor from "./activitySession/instructor"
import activitySessionStationActions from "./activitySession/actions"
import activitySessionStationParent from "./activitySession/parent"
import activitySessionStationRoute from "./activitySession/route"
import badgeRouter from "./badge";
import routeRouter from "./route";
import leaderboardRouter from "./leaderboard";
import notificationRouter from "./notification";
import surveyRouter from "./survey";

const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);
router.use("/instructor", instructorRouter);
router.use("/admin", adminRouter);
router.use("/auth", authRouter);
router.use("/parent", parentRouter);
router.use("/child", childRouter);
router.use("/health-professional", healthProfessionalRouter);
router.use("/medical-report", medicalReportRouter);
router.use("/communication", communicationRouter);
router.use("/issue", issueRouter);
router.use("/station", stationRouter);
router.use("/dashboard", dashboardRouter);
router.use("/activity-session/station", activitySessionStationRouter);
router.use("/activity-session/child", activitySessionStationChild);
router.use("/activity-session/instructor", activitySessionStationInstructor);
router.use("/activity-session/actions", activitySessionStationActions);
router.use("/activity-session/parent", activitySessionStationParent);
router.use("/activity-session/route", activitySessionStationRoute);
router.use("/activity-session", activitySessionRouter);
router.use("/user", userRouter);
router.use("/badge", badgeRouter);
router.use("/route", routeRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/notification", notificationRouter);
router.use("/survey", surveyRouter);

export default router;
