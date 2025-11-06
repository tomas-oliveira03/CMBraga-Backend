export const MAX_KML_SIZE = 1 * 1024 * 1024 // 1MB

export const USER_DEFAULT_PROFILE_PICTURES = [
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-1.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-2.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-3.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-4.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-5.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-6.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-7.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-8.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-9.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-10.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-11.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-12.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-13.jpg",
    "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439325/CMBraga/users/default-profile-picture-14.jpg"
]

export const GROUP_DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/dwffdkytm/image/upload/v1762439258/CMBraga/groups/default-group-picture-1.jpg"

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