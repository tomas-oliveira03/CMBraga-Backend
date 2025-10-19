import { envs } from '@/config';
import { logger } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: envs.CLOUD_NAME,
	api_key: envs.CLOUD_API_KEY,
	api_secret: envs.CLOUD_API_SECRET
});


export async function uploadFileBuffer(buffer: Buffer, fileName: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: "CMBraga/tmp",
				public_id: `${fileName}-${Date.now()}`,
				resource_type: 'raw'
			},
			(error, result) => {
				if (error) {
					reject(new Error('Failed to upload file to cloud storage'));
				} else {
					resolve(result!.secure_url);
				}
			}
		);

		uploadStream.end(buffer);
	});
}


export async function uploadImageBuffer(buffer: Buffer, fileName: string, folderName: string, defaultImage: boolean=false): Promise<string> {
	return new Promise((resolve, reject) => {
		const publicId = defaultImage ? fileName : `${fileName}-${Date.now()}`;
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: `CMBraga/${folderName}`,
				public_id: publicId,
				resource_type: 'image',
				transformation: [{
					quality: 'auto',
					fetch_format: 'auto'
				}]
			},
			(error, result) => {
				if (error) {
					reject(new Error('Failed to upload file to cloud storage'));
				} else {
					resolve(result!.secure_url);
				}
			}
		);

		uploadStream.end(buffer);
	});
}


export async function uploadImagesBuffer(files: { buffer: Buffer; fileName: string }[], folderName: string, defaultImages: boolean=false): Promise<string[]> {
	try {
		const uploadPromises = files.map(file => uploadImageBuffer(file.buffer, file.fileName, folderName, defaultImages));

		const urls = await Promise.all(uploadPromises);
		return urls;
	} catch (error) {
		throw new Error('Failed to upload one or more images');
	}
}


export async function deleteFile(fileURL: string) {
	try {
		const urlParts = fileURL.split('/');

		const uploadIndex = urlParts.findIndex(part => part === 'upload');
		if (uploadIndex === -1) {
			throw new Error('Invalid Cloudinary URL: "upload" not found');
		}

		const relevantParts = urlParts.slice(uploadIndex + 2);
		const publicId = relevantParts.join('/');

		const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
		return result;
	} catch (error) {
		throw new Error('Failed to delete file from cloud storage');
	}
}


export async function deleteImageSafe(imageUrl: string) {
	try {
		if (!imageUrl) {
			throw new Error("No image URL provided");
		}

		const urlParts = imageUrl.split("/");

		const uploadIndex = urlParts.findIndex(part => part === "upload");
		if (uploadIndex === -1) {
			throw new Error('Invalid Cloudinary URL: "upload" segment not found');
		}

		const relevantParts = urlParts.slice(uploadIndex + 1);
		const versionPart = relevantParts[0]?.startsWith("v") ? relevantParts[0] : null;
		const publicIdParts = versionPart
			? relevantParts.slice(1)
			: relevantParts;

		const lastPart = publicIdParts.pop();
		const publicIdWithoutExt = lastPart?.split(".")[0];
		const publicId = [...publicIdParts, publicIdWithoutExt].join("/");

		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: "image",
		});

		return result;
	} catch (error) {
		logger.error("Failed to delete image from Cloudinary:", (error as Error).message);
	}
}



export async function checkImageExists(imageUrl: string): Promise<boolean> {
	try {
		if (!imageUrl) throw new Error("No image URL provided");

		const urlParts = imageUrl.split("/");
		const uploadIndex = urlParts.findIndex(part => part === "upload");
		if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL: "upload" not found');

		const relevantParts = urlParts.slice(uploadIndex + 1);
		const versionPart = relevantParts[0]?.startsWith("v") ? relevantParts[0] : null;
		const publicIdParts = versionPart
			? relevantParts.slice(1)
			: relevantParts;

		const lastPart = publicIdParts.pop();
		const publicIdWithoutExt = lastPart?.split(".")[0];
		const publicId = [...publicIdParts, publicIdWithoutExt].join("/");

		await cloudinary.api.resource(publicId, { resource_type: "image" });
		return true;
	} catch (error: any) {
		if (error?.error.http_code === 404) {
			return false;
		}
		throw new Error("Error checking image existence");
	}
}


export async function checkImagesExist(imageUrls: string[]): Promise<Record<string, boolean>> {
	const results: Record<string, boolean> = {};

	await Promise.all(
		imageUrls.map(async (url) => {
			try {
				const exists = await checkImageExists(url);
				results[url] = exists;
			} catch {
				results[url] = false;
			}
		})
	);

	return results;
}
