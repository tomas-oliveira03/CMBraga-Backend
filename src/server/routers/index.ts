import express from "express";
import healthRouter from "./health";
import adminRouter from "./admin";

const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);
router.use("/admin", adminRouter);

export default router;
