import express from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import instructorRouter from "./instructor";

const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);
router.use("/instructors", instructorRouter);
router.use("/admin", adminRouter);

export default router;
