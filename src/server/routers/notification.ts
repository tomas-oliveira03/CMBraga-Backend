import { AppDataSource } from "@/db";
import express from "express";
import { User } from "@/db/entities/User";
import { Notification } from "@/db/entities/Notification";
import { authenticate } from "../middleware/auth";
import { date } from "zod";

const router = express.Router();

router.get("/user/:id", async (req, res) => {
    try{

        const userId = req.params.id;
        const allNotifications = await AppDataSource.getRepository(User).findOne({
            where:{
                id: userId
            },
            relations:{
                notifications: true
            }
        })

        return res.status(200).json(allNotifications?.notifications)

    } catch(error){
            return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get("/:id", authenticate,  async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user?.email;
    
        const notification = await AppDataSource.getRepository(Notification).findOne({
            where:{
                id: notificationId
            }
        });
        
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        
        if (notification.userId !== userId) {
            return res.status(403).json({ message: "Cannot access this notification" });
        }

        return res.status(200).json(notification);
    }
    catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put("/:id",  async (req, res) => {
    try {
        const notificationId = req.params.id;
    
        if(!notificationId){
            return res.status(404).json({ message: "Notification Id is required"})
        }

        const notification = await AppDataSource.getRepository(Notification).findOne({
            where: {
                id: notificationId
            }
        })

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const date = new Date()
        await AppDataSource.getRepository(Notification).update(notificationId, {
            isRead: true,
            updatedAt: date
        })

        return res.status(200).json({message: "Notification marked as read successfully"});
    }
    catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});




router.delete("/:id", authenticate,  async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user?.email;
    
        if(!notificationId){
            return res.status(404).json({ message: "Notification Id is required"})
        }

        const notification = await AppDataSource.getRepository(Notification).findOne({
            where: {
                id: notificationId
            }
        })

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ message: "Cannot delete this notification" });
        }

        await AppDataSource.getRepository(Notification).delete(notificationId);

        return res.status(200).json({message: "Notification deleted successfully"});
    }
    catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});



export default router;