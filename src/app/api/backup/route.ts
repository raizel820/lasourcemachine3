import { NextRequest, NextResponse } from 'next/server';
import { generateBackup } from '@/lib/backup';

// Admin auth helper
function isAdmin(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  return auth === 'Bearer admin-token';
}

// GET /api/backup - Generate and download backup file
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stream = await generateBackup();
    const filename = `lasource-backup-${new Date().toISOString().slice(0, 10)}.zip`;

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Backup generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate backup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/backup/info - Get backup info before generating
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (body.action === 'info') {
      const { db } = await import('@/lib/db');
      const fs = await import('fs');
      const path = await import('path');
      const fsp = await import('fs/promises');

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

      // Count records in each table
      const tables = [
        { key: 'admin_users', model: 'adminUser' },
        { key: 'categories', model: 'category' },
        { key: 'machines', model: 'machine' },
        { key: 'production_lines', model: 'productionLine' },
        { key: 'news_posts', model: 'newsPost' },
        { key: 'projects', model: 'project' },
        { key: 'services', model: 'service' },
        { key: 'partners', model: 'partner' },
        { key: 'faqs', model: 'fAQ' },
        { key: 'leads', model: 'lead' },
        { key: 'site_settings', model: 'siteSetting' },
        { key: 'media', model: 'media' },
      ];

      const tableCounts: { name: string; count: number }[] = [];
      for (const t of tables) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = await (db as any)[t.model].count();
        tableCounts.push({ name: t.key, count });
      }

      // Count files
      let fileCount = 0;
      let totalSize = 0;
      if (fs.existsSync(uploadsDir)) {
        const countFiles = async (dir: string): Promise<void> => {
          const entries = await fsp.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await countFiles(full);
            } else {
              fileCount++;
              try {
                const stat = await fsp.stat(full);
                totalSize += stat.size;
              } catch {}
            }
          }
        };
        await countFiles(uploadsDir);
      }

      return NextResponse.json({
        tables: tableCounts,
        files: { count: fileCount, totalSize },
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Backup info error:', error);
    return NextResponse.json({ error: 'Failed to get backup info' }, { status: 500 });
  }
}
