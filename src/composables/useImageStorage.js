import { uploadImage, imageUrl, deleteImage } from '@/api/images'

export function useImageStorage() {
  return {
    saveImage: uploadImage,
    getImageUrl: async (filename) => imageUrl(filename),
    deleteImage,
  }
}
