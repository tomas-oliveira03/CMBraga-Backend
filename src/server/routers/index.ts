import express from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import instructorRouter from "./instructor";
import parentRouter from "./parent";
import childRouter from "./child";
import healthProfessionalRouter from "./healthProfessional";
import medicalReportRouter from "./medicalReport";
import communicationRouter from "./communication";


const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);
router.use("/instructor", instructorRouter);
router.use("/admin", adminRouter);
router.use("/parent", parentRouter);
router.use("/child", childRouter);
router.use("/health-professional", healthProfessionalRouter);
router.use("/medical-report", medicalReportRouter);
router.use("/communication", communicationRouter);

export default router;
