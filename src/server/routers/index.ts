import express from "express";
import healthRouter from "./health";

const router = express.Router();

// Mount sub-routers
router.use("/health", healthRouter);

export default router;
