import express from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import instructorRouter from "./instructor";
import parentRouter from "./parent";


const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);
router.use("/instructors", instructorRouter);
router.use("/admin", adminRouter);
router.use("/parent", parentRouter);

export default router;
