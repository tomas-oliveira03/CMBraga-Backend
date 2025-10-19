export const USER_DEFAULT_PROFILE_PICTURES = [
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1760867592/CMBraga/users/default-profile-picture1.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1760867592/CMBraga/users/default-profile-picture2.jpg"
]

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]


export function selectRandomDefaultProfilePicture(): string {
    const randomIndex = Math.floor(Math.random() * USER_DEFAULT_PROFILE_PICTURES.length);
    return USER_DEFAULT_PROFILE_PICTURES[randomIndex]!;
}

export function isDefaultProfilePicture(url: string): boolean {
  return USER_DEFAULT_PROFILE_PICTURES.includes(url);
}

export function isValidImageFile(file: Express.Multer.File): boolean {
  return allowedImageTypes.includes(file.mimetype);
}


export function areValidImageFiles(files: Express.Multer.File[]): boolean {
  return files.every(file => allowedImageTypes.includes(file.mimetype));
}