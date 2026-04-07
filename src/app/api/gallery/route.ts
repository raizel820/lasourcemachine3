import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, unlink, mkdir, writeFile } from 'fs/promises'
import { statSync, existsSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { MAX_UPLOAD_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/constants'

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
  source: string  // 'disk' | 'machine' | 'production-line' | 'news' | 'project' | 'service' | 'partner' | 'settings'
  sourceLabel: string  // e.g. "Machine: CNC Press 500T"
  isExternal: boolean  // true if URL is not on local disk
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
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

function isImageUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return /\.(jpg|jpeg|png|webp|gif|svg|bmp|ico)(\?.*)?$/i.test(lower) || lower.startsWith('data:image/')
}

function getFileNameFromUrl(url: string): string {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || url
  } catch {
    return url
  }
}

function guessTypeFromUrl(url: string): 'image' | 'document' | 'other' {
  if (isImageUrl(url)) return 'image'
  if (/\.pdf(\?.*)?$/i.test(url)) return 'document'
  return 'other'
}

/** Collect all unique image URLs from a JSON array string */
function collectFromJsonImagesField(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return []
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) {
      return parsed.filter((u: unknown) => typeof u === 'string' && u.trim())
    }
  } catch { /* not valid JSON */ }
  return []
}

/** Collect a single image URL */
function collectSingle(url: string | null | undefined): string[] {
  if (!url || typeof url !== 'string' || !url.trim()) return []
  return [url.trim()]
}

// GET /api/gallery - List all uploaded files (disk + DB entities)
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sourceFilter = searchParams.get('source') || ''
    const typeFilter = searchParams.get('type') || ''
    const searchQuery = searchParams.get('search') || ''

    const allFiles: GalleryFile[] = []
    const seenUrls = new Set<string>()

    const addFile = (f: GalleryFile) => {
      const key = f.url.split('?')[0] // dedupe ignoring query params
      if (seenUrls.has(key)) return
      seenUrls.add(key)

      // Apply type filter
      if (typeFilter && typeFilter !== 'all' && f.type !== typeFilter) return
      // Apply search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!f.fileName.toLowerCase().includes(q) && !f.sourceLabel.toLowerCase().includes(q) && !f.url.toLowerCase().includes(q)) return
      }
      // Apply source filter
      if (sourceFilter && sourceFilter !== 'all' && f.source !== sourceFilter) return

      allFiles.push(f)
    }

    // ─── Part 1: Scan uploaded files from disk ───
    if (existsSync(UPLOAD_DIR)) {
      const folders = await readdir(UPLOAD_DIR)

      for (const folder of folders) {
        const folderPath = path.join(UPLOAD_DIR, folder)
        const folderStat = await stat(folderPath).catch(() => null)
        if (!folderStat || !folderStat.isDirectory()) continue

        const files = await readdir(folderPath)
        for (const file of files) {
          if (file.startsWith('.')) continue

          const filePath = path.join(folderPath, file)
          const fileStat = await stat(filePath).catch(() => null)
          if (!fileStat || !fileStat.isFile()) continue

          const mimeType = guessMimeType(file)
          const fileType = getFileType(mimeType)
          const url = `/uploads/${folder}/${file}`

          addFile({
            url,
            fileName: file,
            folder,
            size: fileStat.size,
            sizeFormatted: formatFileSize(fileStat.size),
            mimeType,
            type: fileType,
            lastModified: fileStat.mtime.toISOString(),
            source: 'disk',
            sourceLabel: folder,
            isExternal: false,
          })
        }
      }
    }

    // ─── Part 2: Collect images from DB entities ───

    // Machines: coverImage + images[] + pdfUrl
    const machines = await db.machine.findMany({ select: { id: true, name: true, slug: true, coverImage: true, images: true, pdfUrl: true } })
    for (const m of machines) {
      const label = (() => { try { return JSON.parse(m.name).fr || JSON.parse(m.name).en || m.slug } catch { return m.slug } })()
      for (const url of [...collectSingle(m.coverImage), ...collectFromJsonImagesField(m.images)]) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'machines',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'machine',
          sourceLabel: `Machine: ${label}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
      if (m.pdfUrl) {
        addFile({
          url: m.pdfUrl,
          fileName: getFileNameFromUrl(m.pdfUrl),
          folder: 'machines',
          size: 0,
          sizeFormatted: '—',
          mimeType: 'application/pdf',
          type: 'document',
          lastModified: '',
          source: 'machine',
          sourceLabel: `Machine: ${label} (PDF)`,
          isExternal: !m.pdfUrl.startsWith('/uploads/'),
        })
      }
    }

    // Production Lines: coverImage + images[]
    const productionLines = await db.productionLine.findMany({ select: { id: true, name: true, slug: true, coverImage: true, images: true } })
    for (const pl of productionLines) {
      const label = (() => { try { return JSON.parse(pl.name).fr || JSON.parse(pl.name).en || pl.slug } catch { return pl.slug } })()
      for (const url of [...collectSingle(pl.coverImage), ...collectFromJsonImagesField(pl.images)]) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'production-lines',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'production-line',
          sourceLabel: `Production Line: ${label}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
    }

    // News: coverImage + images[]
    const newsPosts = await db.newsPost.findMany({ select: { id: true, title: true, slug: true, coverImage: true, images: true } })
    for (const n of newsPosts) {
      const label = (() => { try { return JSON.parse(n.title).fr || JSON.parse(n.title).en || n.slug } catch { return n.slug } })()
      for (const url of [...collectSingle(n.coverImage), ...collectFromJsonImagesField(n.images)]) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'news',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'news',
          sourceLabel: `News: ${label}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
    }

    // Projects: coverImage + images[]
    const projects = await db.project.findMany({ select: { id: true, title: true, slug: true, coverImage: true, images: true } })
    for (const p of projects) {
      const label = (() => { try { return JSON.parse(p.title).fr || JSON.parse(p.title).en || p.slug } catch { return p.slug } })()
      for (const url of [...collectSingle(p.coverImage), ...collectFromJsonImagesField(p.images)]) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'projects',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'project',
          sourceLabel: `Project: ${label}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
    }

    // Services: image
    const services = await db.service.findMany({ select: { id: true, title: true, image: true } })
    for (const s of services) {
      const label = (() => { try { return JSON.parse(s.title).fr || JSON.parse(s.title).en || s.id } catch { return s.id } })()
      for (const url of collectSingle(s.image)) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'services',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'service',
          sourceLabel: `Service: ${label}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
    }

    // Partners: logo
    const partners = await db.partner.findMany({ select: { id: true, name: true, logo: true } })
    for (const p of partners) {
      for (const url of collectSingle(p.logo)) {
        if (!isImageUrl(url)) continue
        addFile({
          url,
          fileName: getFileNameFromUrl(url),
          folder: 'partners',
          size: 0,
          sizeFormatted: '—',
          mimeType: guessMimeType(url),
          type: 'image',
          lastModified: '',
          source: 'partner',
          sourceLabel: `Partner: ${p.name}`,
          isExternal: !url.startsWith('/uploads/'),
        })
      }
    }

    // Site Settings: company_logo, company_favicon, seo_og_image
    const imageSettings = await db.siteSetting.findMany({
      where: { key: { in: ['company_logo', 'company_favicon', 'seo_og_image'] } }
    })
    for (const setting of imageSettings) {
      const url = setting.value
      if (!url || !isImageUrl(url)) continue
      const settingLabel: Record<string, string> = {
        company_logo: 'Company Logo',
        company_favicon: 'Favicon',
        seo_og_image: 'OG Image',
      }
      addFile({
        url,
        fileName: getFileNameFromUrl(url),
        folder: 'branding',
        size: 0,
        sizeFormatted: '—',
        mimeType: guessMimeType(url),
        type: 'image',
        lastModified: setting.updatedAt?.toISOString() || '',
        source: 'settings',
        sourceLabel: settingLabel[setting.key] || setting.key,
        isExternal: !url.startsWith('/uploads/'),
      })
    }

    // Sort: disk files first (newest), then DB entities by source label
    allFiles.sort((a, b) => {
      // Disk files first
      if (a.source === 'disk' && b.source !== 'disk') return -1
      if (b.source === 'disk' && a.source !== 'disk') return 1
      // Both disk: by date descending
      if (a.source === 'disk' && b.source === 'disk') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      }
      // Both DB: alphabetical by source label
      return a.sourceLabel.localeCompare(b.sourceLabel)
    })

    // Compute folders list from disk
    const diskFolders: string[] = []
    if (existsSync(UPLOAD_DIR)) {
      const dirs = await readdir(UPLOAD_DIR)
      for (const d of dirs) {
        const p = path.join(UPLOAD_DIR, d)
        try { if (statSync(p).isDirectory()) diskFolders.push(d) } catch { /* skip */ }
      }
    }

    // Source counts
    const sourceCounts: Record<string, number> = {}
    for (const f of allFiles) {
      sourceCounts[f.source] = (sourceCounts[f.source] || 0) + 1
    }

    // Stats (only counting images from disk for size)
    const diskImages = allFiles.filter(f => f.source === 'disk')
    const stats = {
      total: allFiles.length,
      images: allFiles.filter(f => f.type === 'image').length,
      documents: allFiles.filter(f => f.type === 'document').length,
      totalSize: formatFileSize(diskImages.reduce((sum, f) => sum + f.size, 0)),
      sourceCounts,
    }

    return NextResponse.json({
      data: allFiles,
      folders: diskFolders,
      sources: Object.keys(sourceCounts),
      stats,
    })
  } catch (error) {
    console.error('Error listing gallery:', error)
    return NextResponse.json({ error: 'Failed to list gallery' }, { status: 500 })
  }
}

// DELETE /api/gallery - Delete file(s) from disk
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
    const skipped: string[] = []

    for (const fileUrl of urls) {
      if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
        skipped.push(fileUrl)
        continue
      }

      const fullPath = path.join(process.cwd(), 'public', fileUrl)
      if (!existsSync(fullPath)) {
        skipped.push(fileUrl)
        continue
      }

      try {
        await unlink(fullPath)
        deleted.push(fileUrl)
      } catch {
        skipped.push(fileUrl)
      }
    }

    return NextResponse.json({
      message: `${deleted.length} file(s) deleted, ${skipped.length} skipped`,
      deleted,
      skipped,
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
