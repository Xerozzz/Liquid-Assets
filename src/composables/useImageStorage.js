export function useImageStorage() {
  const imagesDirName = 'cocktail_images'

  /**
   * Gets the directory handle for our images, creating it if it doesn't exist.
   */
  async function getImagesDir() {
    const root = await navigator.storage.getDirectory()
    return await root.getDirectoryHandle(imagesDirName, { create: true })
  }

  /**
   * Saves a File object to OPFS and returns the stored filename.
   * @param {File} file - The file object from the input.
   * @returns {Promise<string>} The unique filename saved.
   */
  async function saveImage(file) {
    try {
      // Generate a unique filename (timestamp + random string + extension)
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      // Get handle to the directory
      const dirHandle = await getImagesDir()

      // Create a file handle
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true })

      // Create a writable stream and write the file
      const writable = await fileHandle.createWritable()
      await writable.write(file)
      await writable.close()

      console.log(`Image saved to OPFS: ${filename}`)
      return filename
    } catch (error) {
      console.error('Failed to save image to OPFS:', error)
      throw error
    }
  }

  /**
   * Retrieves an image from OPFS and converts it to a Blob URL for display.
   * @param {string} filename
   * @returns {Promise<string|null>} A blob URL (e.g. blob:http://localhost...) or null
   */
  async function getImageUrl(filename) {
    if (!filename) return null
    try {
      const dirHandle = await getImagesDir()
      const fileHandle = await dirHandle.getFileHandle(filename)
      const file = await fileHandle.getFile()
      // Create a temporary URL that points to this file in memory
      return URL.createObjectURL(file)
    } catch (error) {
      console.warn(`Could not load image ${filename}:`, error)
      return null
    }
  }

  /**
   * Deletes an image file from OPFS.
   */
  async function deleteImage(filename) {
    if (!filename) return
    try {
      const dirHandle = await getImagesDir()
      await dirHandle.removeEntry(filename)
    } catch (error) {
      console.warn('Failed to delete image:', error)
    }
  }

  return {
    saveImage,
    getImageUrl,
    deleteImage,
  }
}
