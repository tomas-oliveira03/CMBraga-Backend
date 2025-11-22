import { AppDataSource } from "@/db";
import { CloudDefaultImages } from "@/db/entities/CloudDefaultImages";
import { DefaultImageType } from "./types";

export const MAX_KML_SIZE = 1 * 1024 * 1024 // 1MB

export let USER_DEFAULT_PROFILE_PICTURES: string[] = []

export let GROUP_DEFAULT_PROFILE_PICTURE: string = ""

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]


export function selectRandomDefaultProfilePicture(): string {
    const randomIndex = Math.floor(Math.random() * USER_DEFAULT_PROFILE_PICTURES.length);
    return USER_DEFAULT_PROFILE_PICTURES[randomIndex]!;
}

export function isDefaultProfilePicture(url: string): boolean {
  return USER_DEFAULT_PROFILE_PICTURES.includes(url);
}

export function isDefaultGroupProfilePicture(url: string): boolean {
  return GROUP_DEFAULT_PROFILE_PICTURE === url;
}

export function isValidImageFile(file: Express.Multer.File): boolean {
  return allowedImageTypes.includes(file.mimetype);
}


export function areValidImageFiles(files: Express.Multer.File[]): boolean {
  return files.every(file => allowedImageTypes.includes(file.mimetype));
}

export async function hydrateDefaultProfilePicturesFromDB() {
    try {
        const cloudImages = await AppDataSource.getRepository(CloudDefaultImages).find();

        USER_DEFAULT_PROFILE_PICTURES = cloudImages
          .filter(img => img.imageType === DefaultImageType.USERS)
          .map(img => img.imageUrl);
            
        GROUP_DEFAULT_PROFILE_PICTURE = cloudImages
          .filter(img => img.imageType === DefaultImageType.GROUPS)
          .map(img => img.imageUrl)[0] || "";
    }
    catch (error) {
        console.error("Error hydrating default profile pictures from DB:", error);
    }
}