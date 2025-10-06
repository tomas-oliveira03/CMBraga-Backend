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
import activitySessionRouter from "./activitySession";
import dummyRouter from "./dummy";
import issueRouter from "./issue";
import stationRouter from "./station";
import dashboardRouter from "./dashboard";

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
router.use("/activity-session", activitySessionRouter);
router.use("/dummy", dummyRouter);
router.use("/issue", issueRouter);
router.use("/station", stationRouter);
router.use("/dashboard", dashboardRouter);

export default router;
