'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ImageIcon, FileText, Trash2, Upload, Search, FolderOpen,
  Filter, X, CheckSquare, Square, ChevronLeft, ChevronRight,
  ZoomIn, Download, RefreshCw, HardDrive, AlertTriangle, ImagePlus,
  Globe, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

interface GalleryFile {
  url: string;
  fileName: string;
  folder: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  type: 'image' | 'document' | 'other';
  lastModified: string;
  source: string;
  sourceLabel: string;
  isExternal: boolean;
}

interface GalleryStats {
  total: number;
  images: number;
  documents: number;
  totalSize: string;
  sourceCounts?: Record<string, number>;
}

const SOURCE_LABELS: Record<string, string> = {
  disk: 'Uploads',
  machine: 'Machines',
  'production-line': 'Production Lines',
  news: 'News',
  project: 'Projects',
  service: 'Services',
  partner: 'Partners',
  settings: 'Settings',
};

const SOURCE_COLORS: Record<string, string> = {
  disk: 'bg-blue-100 text-blue-700 border-blue-200',
  machine: 'bg-green-100 text-green-700 border-green-200',
  'production-line': 'bg-purple-100 text-purple-700 border-purple-200',
  news: 'bg-amber-100 text-amber-700 border-amber-200',
  project: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  service: 'bg-pink-100 text-pink-700 border-pink-200',
  partner: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  settings: 'bg-red-100 text-red-700 border-red-200',
};

const ITEMS_PER_PAGE = 24;

export default function AdminGalleryPage() {
  const [files, setFiles] = useState<GalleryFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [stats, setStats] = useState<GalleryStats>({ total: 0, images: 0, documents: 0, totalSize: '0 B' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewFile, setPreviewFile] = useState<GalleryFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ urls: string[]; names: string[]; hasExternal: boolean } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/gallery?${params.toString()}`, {
        headers: { 'Authorization': 'Bearer admin-token' },
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.data || []);
        setFolders(data.folders || []);
        setSources(data.sources || []);
        setStats(data.stats || { total: 0, images: 0, documents: 0, totalSize: '0 B' });
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchFiles();
    setCurrentPage(1);
    setSelectedFiles(new Set());
  }, [fetchFiles]);

  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE);
  const paginatedFiles = files.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const deletableFiles = paginatedFiles.filter(f => !f.isExternal);

  const toggleSelect = (url: string) => {
    const next = new Set(selectedFiles);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedFiles(next);
  };

  const selectAllDeletable = () => {
    const deletable = paginatedFiles.filter(f => !f.isExternal);
    if (selectedFiles.size === deletable.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(deletable.map(f => f.url)));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < selected.length; i++) formData.append('files', selected[i]);
      formData.append('folder', uploadFolder);
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer admin-token' },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.errors?.length > 0) {
          alert(`${data.uploaded.length} uploaded, ${data.errors.length} failed:\n${data.errors.map((e: { error: string }) => e.error).join(', ')}`);
        }
        fetchFiles();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const deletableUrls = deleteTarget.urls.filter(u => u.startsWith('/uploads/'));
    if (deletableUrls.length === 0) {
      setDeleteTarget(null);
      return;
    }
    try {
      const res = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
        body: JSON.stringify({ urls: deletableUrls }),
      });
      if (res.ok) {
        setSelectedFiles(new Set());
        fetchFiles();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Media Gallery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All images from machines, production lines, news, projects, services, partners &amp; uploads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} multiple accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          <Select value={uploadFolder} onValueChange={setUploadFolder}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">general</SelectItem>
              <SelectItem value="branding">branding</SelectItem>
              <SelectItem value="machines">machines</SelectItem>
              <SelectItem value="news">news</SelectItem>
              <SelectItem value="documents">documents</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="cursor-pointer">
            {isUploading ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><HardDrive className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Files</p></div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600"><ImageIcon className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold">{stats.images}</p><p className="text-xs text-muted-foreground">Images</p></div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><FileText className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold">{stats.documents}</p><p className="text-xs text-muted-foreground">Documents</p></div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Database className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold">{stats.sourceCounts ? Object.keys(stats.sourceCounts).length : 0}</p><p className="text-xs text-muted-foreground">Sources</p></div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files or sources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-3.5 w-3.5" /></button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Source filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Database className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(s => (
                <SelectItem key={s} value={s}>{SOURCE_LABELS[s] || s} {stats.sourceCounts?.[s] ? `(${stats.sourceCounts[s]})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[110px] h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>

          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">{selectedFiles.size} selected</Badge>
              {deletableFiles.length > 0 && (
                <Button size="sm" variant="destructive" className="h-8 text-xs cursor-pointer" onClick={() => {
                  const sel = files.filter(f => selectedFiles.has(f.url) && !f.isExternal);
                  setDeleteTarget({ urls: sel.map(f => f.url), names: sel.map(f => f.sourceLabel), hasExternal: false });
                }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete ({deletableFiles.length})
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 text-xs cursor-pointer" onClick={() => setSelectedFiles(new Set())}>Clear</Button>
            </div>
          )}

          <Button size="sm" variant="ghost" className="h-8 text-xs cursor-pointer" onClick={() => setIsSelecting(!isSelecting)}>
            {isSelecting ? <CheckSquare className="h-3.5 w-3.5 mr-1" /> : <Square className="h-3.5 w-3.5 mr-1" />}
            Select
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs cursor-pointer" onClick={fetchFiles}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Select All */}
      {isSelecting && paginatedFiles.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={selectAllDeletable} className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
            {selectedFiles.size === deletableFiles.length && deletableFiles.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Select all deletable ({deletableFiles.length})
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <ImagePlus className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No files found</h3>
          <p className="text-sm text-muted-foreground mt-1">{searchQuery || sourceFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Upload your first file to get started'}</p>
          {!searchQuery && sourceFilter === 'all' && typeFilter === 'all' && (
            <Button className="mt-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Upload Files</Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <TooltipProvider delayDuration={300}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {paginatedFiles.map((file) => (
              <div key={file.url} className="group relative">
                {isSelecting && !file.isExternal && (
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.url); }} className="absolute top-2 left-2 z-20 cursor-pointer">
                    {selectedFiles.has(file.url) ? <CheckSquare className="h-5 w-5 text-primary bg-background rounded" /> : <Square className="h-5 w-5 text-muted-foreground bg-background/80 rounded" />}
                  </button>
                )}

                <Card
                  className={`overflow-hidden border transition-all cursor-pointer hover:shadow-md ${
                    selectedFiles.has(file.url) ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'
                  }`}
                  onClick={() => { if (isSelecting && !file.isExternal) toggleSelect(file.url); else if (file.type === 'image') setPreviewFile(file); }}
                >
                  <div className="relative aspect-square bg-muted">
                    {file.type === 'image' ? (
                      <img src={file.url} alt={file.fileName} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground text-center truncate max-w-full">{file.fileName}</span>
                      </div>
                    )}

                    {/* Source badge */}
                    <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4 border ${SOURCE_COLORS[file.source] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {SOURCE_LABELS[file.source] || file.source}
                    </Badge>

                    {/* External badge */}
                    {file.isExternal && (
                      <Badge className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />External
                      </Badge>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {file.type === 'image' && (
                        <Tooltip><TooltipTrigger asChild><button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center cursor-pointer hover:bg-white"><ZoomIn className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Preview</TooltipContent></Tooltip>
                      )}
                      <Tooltip><TooltipTrigger asChild><button onClick={(e) => { e.stopPropagation(); handleCopyUrl(file.url); }} className="h-8 w-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center cursor-pointer hover:bg-white">{copiedUrl === file.url ? <CheckSquare className="h-4 w-4 text-green-600" /> : <Download className="h-4 w-4" />}</button></TooltipTrigger><TooltipContent>{copiedUrl === file.url ? 'Copied!' : 'Copy URL'}</TooltipContent></Tooltip>
                      {!file.isExternal && (
                        <Tooltip><TooltipTrigger asChild><button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ urls: [file.url], names: [file.sourceLabel], hasExternal: false }); }} className="h-8 w-8 rounded-full bg-red-500/90 text-white flex items-center justify-center cursor-pointer hover:bg-red-600"><Trash2 className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                      )}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" title={file.fileName}>{file.fileName}</p>
                    <p className="text-[10px] text-muted-foreground truncate" title={file.sourceLabel}>{file.sourceLabel}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </TooltipProvider>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                <div className="col-span-1">{isSelecting && <button onClick={selectAllDeletable} className="cursor-pointer">{selectedFiles.size === deletableFiles.length ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}</button>}</div>
                <div className="col-span-4">File</div>
                <div className="col-span-3">Source</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1">Size</div>
                <div className="col-span-2">Date</div>
              </div>
              {paginatedFiles.map((file) => (
                <div key={file.url} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm hover:bg-muted/30 transition-colors cursor-pointer ${selectedFiles.has(file.url) ? 'bg-primary/5' : ''}`} onClick={() => { if (isSelecting && !file.isExternal) toggleSelect(file.url); else if (file.type === 'image') setPreviewFile(file); }}>
                  <div className="col-span-1">
                    {isSelecting && !file.isExternal && (
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.url); }} className="cursor-pointer">{selectedFiles.has(file.url) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}</button>
                    )}
                  </div>
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    {file.type === 'image' ? (
                      <div className="h-8 w-8 rounded bg-muted flex-shrink-0 overflow-hidden"><img src={file.url} alt="" className="h-full w-full object-cover" /></div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs" title={file.fileName}>{file.fileName}</p>
                      {file.isExternal && <span className="text-[10px] text-yellow-600 flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />External</span>}
                    </div>
                  </div>
                  <div className="col-span-3 min-w-0"><Badge className={`text-[10px] px-1.5 py-0 h-4 border ${SOURCE_COLORS[file.source] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{file.sourceLabel}</Badge></div>
                  <div className="col-span-1 text-xs text-muted-foreground capitalize">{file.type}</div>
                  <div className="col-span-1 text-xs text-muted-foreground">{file.sizeFormatted}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">{formatDate(file.lastModified)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" className="h-8 cursor-pointer" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({files.length} files)</span>
          <Button size="sm" variant="outline" className="h-8 cursor-pointer" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {/* View Toggle */}
      <div className="fixed bottom-6 right-6 flex gap-1 bg-background border rounded-lg shadow-lg p-1 z-50">
        <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'ghost'} className="h-8 w-8 p-0 cursor-pointer" onClick={() => setViewMode('grid')} title="Grid view">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </Button>
        <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} className="h-8 w-8 p-0 cursor-pointer" onClick={() => setViewMode('list')} title="List view">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewFile && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-sm font-medium truncate">{previewFile.fileName}</DialogTitle>
                <DialogDescription className="text-xs">
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 border mr-1.5 ${SOURCE_COLORS[previewFile.source] || ''}`}>{previewFile.sourceLabel}</Badge>
                  {previewFile.isExternal && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-200"><Globe className="h-2.5 w-2.5 mr-0.5" />External URL</Badge>}
                  {!previewFile.isExternal && <span className="ml-1">&middot; {previewFile.sizeFormatted}</span>}
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '70vh' }}>
                <img src={previewFile.url} alt={previewFile.fileName} className="max-w-full max-h-[70vh] object-contain" />
              </div>
              <div className="flex items-center justify-between p-4 pt-2">
                <div className="text-xs text-muted-foreground min-w-0 flex-1 mr-4">
                  URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs select-all break-all">{previewFile.url}</code>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => handleCopyUrl(previewFile.url)}>
                    {copiedUrl === previewFile.url ? 'Copied!' : 'Copy URL'}
                  </Button>
                  {!previewFile.isExternal && (
                    <Button size="sm" variant="destructive" className="text-xs cursor-pointer" onClick={() => { setDeleteTarget({ urls: [previewFile.url], names: [previewFile.sourceLabel], hasExternal: false }); setPreviewFile(null); }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Files</DialogTitle>
            <DialogDescription>
              {deleteTarget?.urls.length === 1
                ? 'Are you sure you want to delete this file? This will remove it from disk. Remove it from any entity first if it is still in use.'
                : `Are you sure you want to delete ${deleteTarget?.urls.length} files? Only local files can be deleted.`}
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && deleteTarget.names.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-muted rounded-lg p-3">
              {deleteTarget.names.map((name, i) => <p key={i} className="text-xs text-muted-foreground truncate">{name}</p>)}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="cursor-pointer">
              <Trash2 className="h-4 w-4 mr-1.5" />Delete {deleteTarget?.urls.length === 1 ? 'File' : `(${deleteTarget?.urls.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
