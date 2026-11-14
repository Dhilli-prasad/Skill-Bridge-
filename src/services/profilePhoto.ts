const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const supportedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])

export function validateProfilePhoto(file: Pick<File, 'name' | 'size' | 'type'>) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!supportedExtensions.has(extension) || !supportedTypes.has(file.type.toLowerCase())) {
    return 'Choose a JPG, JPEG, PNG, or WebP image.'
  }
  if (file.size < 1 || file.size > MAX_PHOTO_SIZE) return 'Choose an image no larger than 5 MB.'
  return undefined
}
