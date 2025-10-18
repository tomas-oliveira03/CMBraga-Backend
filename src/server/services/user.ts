import { isDefaultProfilePicture } from "@/helpers/storage";
import { deleteImageSafe, uploadImageBuffer } from "./cloud";

export async function updateProfilePicture(oldProfilePictureURL:string, newProfilePicturebuffer: Buffer){

    const isDefaultPicture = isDefaultProfilePicture(oldProfilePictureURL);
    if (!isDefaultPicture){
        deleteImageSafe(oldProfilePictureURL);
    }

    const profilePictureURL = await uploadImageBuffer(newProfilePicturebuffer, "profile-picture", "users");
    return profilePictureURL
}