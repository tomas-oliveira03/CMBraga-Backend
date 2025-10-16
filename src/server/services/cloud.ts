import { envs } from '@/config';
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


export async function uploadImage(filePath: string, fileName: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'CMBraga/images',     
      public_id: `${fileName}-${Date.now()}`,
      resource_type: 'image',       
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    return result.secure_url;
  } catch (error) {
    throw new Error('Failed to upload image to cloud storage');
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