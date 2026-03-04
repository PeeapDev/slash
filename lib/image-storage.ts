"use client"

import { offlineDB, Attachment } from './offline-first-db'
import { supabase, isSupabaseConfigured } from './database'

const MAX_THUMBNAIL_WIDTH = 200
const THUMBNAIL_QUALITY = 0.6

// Compress an image using canvas
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// Generate a thumbnail from a file
async function generateThumbnail(file: File | Blob): Promise<ArrayBuffer> {
  const blob = await compressImage(
    file instanceof File ? file : new File([file], 'thumb.jpg', { type: 'image/jpeg' }),
    MAX_THUMBNAIL_WIDTH,
    THUMBNAIL_QUALITY
  )
  return blob.arrayBuffer()
}

// Save an image to IndexedDB
export async function saveImage(
  file: File,
  metadata?: { parentStore?: string; parentId?: string }
): Promise<string> {
  // Compress if it's an image
  let data: ArrayBuffer
  let thumbnail: ArrayBuffer | undefined

  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(file)
    data = await compressed.arrayBuffer()
    thumbnail = await generateThumbnail(file)
  } else {
    data = await file.arrayBuffer()
  }

  const attachment = await offlineDB.create<Attachment>('attachments', {
    fileName: file.name,
    mimeType: file.type,
    fileSize: data.byteLength,
    data,
    thumbnail,
    uploadStatus: 'pending',
    parentStore: metadata?.parentStore,
    parentId: metadata?.parentId,
  } as any)

  return attachment.id
}

// Get an image from IndexedDB and return a Blob + object URL
export async function getImage(id: string): Promise<{ blob: Blob; url: string } | null> {
  const attachment = await offlineDB.getById<Attachment>('attachments', id)
  if (!attachment) return null

  // If we have a remote URL and no local data, use the remote URL
  if (attachment.remoteUrl && !attachment.data) {
    return { blob: new Blob(), url: attachment.remoteUrl }
  }

  const blob = new Blob([attachment.data], { type: attachment.mimeType })
  const url = URL.createObjectURL(blob)
  return { blob, url }
}

// Get thumbnail from IndexedDB
export async function getThumbnail(id: string): Promise<{ blob: Blob; url: string } | null> {
  const attachment = await offlineDB.getById<Attachment>('attachments', id)
  if (!attachment || !attachment.thumbnail) return null

  const blob = new Blob([attachment.thumbnail], { type: 'image/jpeg' })
  const url = URL.createObjectURL(blob)
  return { blob, url }
}

// Delete an image from IndexedDB
export async function deleteImage(id: string): Promise<void> {
  await offlineDB.delete('attachments', id)
}

// Get all attachments for a parent record
export async function getAttachmentsForRecord(
  parentStore: string,
  parentId: string
): Promise<Attachment[]> {
  const all = await offlineDB.getAll<Attachment>('attachments', {
    index: 'parentId',
    value: parentId,
  })
  return all.filter((a) => a.parentStore === parentStore)
}

// Sync pending attachments to Supabase Storage
export async function syncImagesToSupabase(): Promise<{
  uploaded: number
  errors: number
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { uploaded: 0, errors: 0 }
  }

  const pending = await offlineDB.getAll<Attachment>('attachments', {
    index: 'uploadStatus',
    value: 'pending',
  })

  let uploaded = 0
  let errors = 0

  for (const attachment of pending) {
    try {
      await offlineDB.update<Attachment>('attachments', attachment.id, {
        uploadStatus: 'uploading',
      } as any)

      const filePath = `attachments/${attachment.id}/${attachment.fileName}`
      const blob = new Blob([attachment.data], { type: attachment.mimeType })

      const { error } = await supabase.storage
        .from('slash-attachments')
        .upload(filePath, blob, {
          contentType: attachment.mimeType,
          upsert: true,
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('slash-attachments')
        .getPublicUrl(filePath)

      await offlineDB.update<Attachment>('attachments', attachment.id, {
        uploadStatus: 'uploaded',
        remoteUrl: urlData.publicUrl,
      } as any)

      uploaded++
    } catch (err: any) {
      console.error(`Failed to upload attachment ${attachment.id}:`, err)
      await offlineDB.update<Attachment>('attachments', attachment.id, {
        uploadStatus: 'error',
        errorMessage: err.message,
      } as any)
      errors++
    }
  }

  return { uploaded, errors }
}

// Get stats about local attachments
export async function getAttachmentStats(): Promise<{
  total: number
  pending: number
  uploaded: number
  errors: number
  totalSizeBytes: number
}> {
  const all = await offlineDB.getAll<Attachment>('attachments')
  return {
    total: all.length,
    pending: all.filter((a) => a.uploadStatus === 'pending').length,
    uploaded: all.filter((a) => a.uploadStatus === 'uploaded').length,
    errors: all.filter((a) => a.uploadStatus === 'error').length,
    totalSizeBytes: all.reduce((sum, a) => sum + (a.fileSize || 0), 0),
  }
}
