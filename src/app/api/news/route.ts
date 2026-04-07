import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Admin auth helper
function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return auth === 'Bearer admin-token'
}

// GET /api/news - List published news posts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
    const skip = (page - 1) * limit

    // Support status filtering: default to 'published' for public, 'all' for admin
    const statusParam = searchParams.get('status')
    const where: Record<string, unknown> = statusParam && statusParam !== 'published'
      ? (statusParam === 'all' ? {} : { status: statusParam })
      : { status: 'published' }

    const [newsPosts, total] = await Promise.all([
      db.newsPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.newsPost.count({ where }),
    ])

    return NextResponse.json({
      data: newsPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching news posts:', error)
    return NextResponse.json({ error: 'Failed to fetch news posts' }, { status: 500 })
  }
}

// POST /api/news - Create news post (admin only)
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      images,
      author,
      status,
      order,
      publishedAt,
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 })
    }

    const existing = await db.newsPost.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'News post with this slug already exists' }, { status: 409 })
    }

    const newsPost = await db.newsPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        images: images || '[]',
        author: author || null,
        status: status || 'draft',
        order: order || 0,
        publishedAt: publishedAt ? new Date(publishedAt) : (status === 'published' ? new Date() : null),
      },
    })

    return NextResponse.json({ data: newsPost }, { status: 201 })
  } catch (error) {
    console.error('Error creating news post:', error)
    return NextResponse.json({ error: 'Failed to create news post' }, { status: 500 })
  }
}
