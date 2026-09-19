export const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxSourceBytes = 5 * 1024 * 1024

export class ImageValidationError extends Error {}

export async function resizeImageToDataUrl(file: File, size = 160): Promise<string> {
  if (!acceptedImageTypes.includes(file.type)) throw new ImageValidationError('Envie uma imagem PNG, JPEG ou WebP.')
  if (file.size > maxSourceBytes) throw new ImageValidationError('A imagem deve ter ate 5 MB.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageValidationError('Nao foi possivel ler esta imagem.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new ImageValidationError('Nao foi possivel processar a imagem.')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}
