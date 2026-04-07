import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Admin auth helper
function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return auth === 'Bearer admin-token'
}

interface GalleryFile {
  url: string
  fileName: string
  folder: string
  size: number
  sizeFormatted: string
  mimeType: string
  type: 'image' | 'document' | 'other'
  lastModified: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

function getFileType(mimeType: string): 'image' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'other'
  if (mimeType === 'application/pdf') return 'document'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
  return 'other'
}

// GET /api/gallery - List all uploaded files
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const folderFilter = searchParams.get('folder') || ''
    const typeFilter = searchParams.get('type') || '' // 'image', 'document', 'all'
    const searchQuery = searchParams.get('search') || ''

    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ data: [], folders: [], stats: { total: 0, images: 0, documents: 0, totalSize: 0 } })
    }

    const folders = await readdir(UPLOAD_DIR)
    const allFiles: GalleryFile[] = []
    const foldersToScan = folderFilter ? [folderFilter] : folders

    for (const folder of foldersToScan) {
      const folderPath = path.join(UPLOAD_DIR, folder)
      const folderStat = await stat(folderPath).catch(() => null)
      if (!folderStat || !folderStat.isDirectory()) continue

      const files = await readdir(folderPath)
      for (const file of files) {
        const filePath = path.join(folderPath, file)
        const fileStat = await stat(filePath).catch(() => null)
        if (!fileStat || !fileStat.isFile()) continue

        // Skip hidden files
        if (file.startsWith('.')) continue

        const mimeType = guessMimeType(file)
        const fileType = getFileType(mimeType)

        // Apply type filter
        if (typeFilter && typeFilter !== 'all' && fileType !== typeFilter) continue

        // Apply search filter
        if (searchQuery && !file.toLowerCase().includes(searchQuery.toLowerCase())) continue

        const url = `/uploads/${folder}/${file}`

        allFiles.push({
          url,
          fileName: file,
          folder,
          size: fileStat.size,
          sizeFormatted: formatFileSize(fileStat.size),
          mimeType,
          type: fileType,
          lastModified: fileStat.mtime.toISOString(),
        })
      }
    }

    // Sort by newest first
    allFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    // Stats
    const stats = {
      total: allFiles.length,
      images: allFiles.filter(f => f.type === 'image').length,
      documents: allFiles.filter(f => f.type === 'document').length,
      totalSize: formatFileSize(allFiles.reduce((sum, f) => sum + f.size, 0)),
    }

    return NextResponse.json({
      data: allFiles,
      folders: folders.filter(f => {
        const s = path.join(UPLOAD_DIR, f)
        try { return existsSync(s) && statSync(s).isDirectory() } catch { return false }
      }),
      stats,
    })
  } catch (error) {
    console.error('Error listing gallery:', error)
    return NextResponse.json({ error: 'Failed to list gallery' }, { status: 500 })
  }
}

// Patch: need statSync
import { statSync } from 'fs'

// DELETE /api/gallery - Delete file(s)
export async function DELETE(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { urls } = body as { urls: string[] }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 })
    }

    const deleted: string[] = []
    const failed: { url: string; error: string }[] = []

    for (const fileUrl of urls) {
      if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
        failed.push({ url: fileUrl, error: 'Invalid path' })
        continue
      }

      const fullPath = path.join(process.cwd(), 'public', fileUrl)
      if (!existsSync(fullPath)) {
        failed.push({ url: fileUrl, error: 'File not found' })
        continue
      }

      try {
        await unlink(fullPath)
        deleted.push(fileUrl)
      } catch (err) {
        failed.push({ url: fileUrl, error: 'Delete failed' })
      }
    }

    return NextResponse.json({
      message: `${deleted.length} file(s) deleted`,
      deleted,
      failed,
    })
  } catch (error) {
    console.error('Error deleting gallery files:', error)
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 })
  }
}

// POST /api/gallery - Upload file(s) to gallery
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const folder = (formData.get('folder') as string) || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const { mkdir, writeFile } = await import('fs/promises')
    const { MAX_UPLOAD_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } = await import('@/lib/constants')

    const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    const uploaded: { url: string; fileName: string; size: number }[] = []
    const errors: { fileName: string; error: string }[] = []

    for (const file of files) {
      if (file.size > MAX_UPLOAD_SIZE) {
        errors.push({ fileName: file.name, error: 'File too large' })
        continue
      }
      if (!allAllowedTypes.includes(file.type)) {
        errors.push({ fileName: file.name, error: `Type "${file.type}" not allowed` })
        continue
      }

      const ext = path.extname(file.name).toLowerCase()
      const baseName = file.name.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${baseName}${ext}`
      const folderPath = path.join(UPLOAD_DIR, folder)

      if (!existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true })
      }

      const filePath = path.join(folderPath, uniqueFileName)
      const bytes = await file.arrayBuffer()
      await writeFile(filePath, Buffer.from(bytes))

      uploaded.push({
        url: `/uploads/${folder}/${uniqueFileName}`,
        fileName: uniqueFileName,
        size: file.size,
      })
    }

    return NextResponse.json({
      message: `${uploaded.length} file(s) uploaded`,
      uploaded,
      errors,
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading to gallery:', error)
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 })
  }
}
