import { put, del } from '@vercel/blob'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'

const isLocalDev = !process.env.BLOB_READ_WRITE_TOKEN

export async function uploadProductImage(file: File, storeId: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB')
  }

  if (isLocalDev) {
    return uploadLocalFile(file, `products/${storeId}`)
  }

  const fileName = `products/${storeId}/${Date.now()}-${file.name}`
  const blob = await put(fileName, file, { access: 'public', addRandomSuffix: true })
  return blob.url
}

export async function deleteImage(url: string): Promise<void> {
  try {
    if (isLocalDev || url.startsWith('/api/uploads/')) {
      const filename = url.replace('/api/uploads/', '')
      const filePath = path.join(process.cwd(), 'uploads', filename)
      await unlink(filePath)
    } else {
      await del(url)
    }
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}

async function uploadLocalFile(file: File, subdir: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', subdir)
  await mkdir(uploadsDir, { recursive: true })

  const ext = path.extname(file.name) || '.png'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
  const filePath = path.join(uploadsDir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  return `/api/uploads/${subdir}/${filename}`
}
