'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { ImageGalleryUpload } from '@/components/ui/image-gallery-upload';
import { getLocalizedValue } from '@/lib/helpers';
import { generateSlug } from '@/lib/helpers';

const ADMIN_HEADERS = { Authorization: 'Bearer admin-token' };

interface MachineItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  specs: string | null;
  images: string;
  coverImage: string | null;
  pdfUrl: string | null;
  basePrice: number | null;
  currency: string;
  featured: boolean;
  status: string;
  order: number;
  machineType: string | null;
  capacity: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SpecItem {
  key_en: string;
  key_fr: string;
  key_ar: string;
  value: string;
}

interface FormData {
  name_en: string;
  name_fr: string;
  name_ar: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
  shortDesc_en: string;
  shortDesc_fr: string;
  shortDesc_ar: string;
  slug: string;
  categoryId: string;
  machineType: string;
  capacity: string;
  basePrice: string;
  currency: string;
  images: string[];
  coverImage: string;
  pdfUrl: string;
  specs: SpecItem[];
  status: string;
  featured: boolean;
  order: number;
}

const emptyForm: FormData = {
  name_en: '',
  name_fr: '',
  name_ar: '',
  description_en: '',
  description_fr: '',
  description_ar: '',
  shortDesc_en: '',
  shortDesc_fr: '',
  shortDesc_ar: '',
  slug: '',
  categoryId: '',
  machineType: '',
  capacity: '',
  basePrice: '',
  currency: 'DZD',
  images: [],
  coverImage: '',
  pdfUrl: '',
  specs: [],
  status: 'draft',
  featured: false,
  order: 0,
};

function parseJsonField(value: string | null): Record<string, string> {
  try {
    const parsed = JSON.parse(value || '{}');
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return { en: String(value || ''), fr: String(value || ''), ar: String(value || '') };
  } catch {
    return { en: String(value || ''), fr: String(value || ''), ar: String(value || '') };
  }
}

function buildJsonField(obj: Record<string, string>): string {
  return JSON.stringify(obj);
}

/** Parse the specs JSON into flat SpecItem[] for the form */
function parseSpecs(specsJson: string | null): SpecItem[] {
  if (!specsJson) return [];
  try {
    const parsed = JSON.parse(specsJson);
    if (!parsed) return [];

    // Nested locale format: {en: [{key, value}], fr: [...], ar: [...]}
    if (parsed.en && Array.isArray(parsed.en)) {
      return parsed.en.map((item: { key?: string; value?: string }, i: number) => ({
        key_en: item.key || '',
        key_fr: parsed.fr?.[i]?.key || '',
        key_ar: parsed.ar?.[i]?.key || '',
        value: item.value || '',
      }));
    }

    // Flat format: [{key, value}] — key may be a JSON locale string
    if (Array.isArray(parsed)) {
      return parsed.map((item: { key?: string; value?: string }) => {
        const keyObj = parseJsonField(item.key || null);
        return {
          key_en: typeof item.key === 'string' && item.key.startsWith('{') ? keyObj.en || '' : (item.key || ''),
          key_fr: typeof item.key === 'string' && item.key.startsWith('{') ? keyObj.fr || '' : (item.key || ''),
          key_ar: typeof item.key === 'string' && item.key.startsWith('{') ? keyObj.ar || '' : (item.key || ''),
          value: item.value || '',
        };
      });
    }

    return [];
  } catch {
    return [];
  }
}

/** Build the specs JSON from form data (nested locale format) */
function buildSpecs(specs: SpecItem[]): string {
  if (specs.length === 0) return '[]';
  const result = {
    en: specs.filter(s => s.key_en || s.value).map(s => ({ key: s.key_en, value: s.value })),
    fr: specs.filter(s => s.key_fr || s.value).map(s => ({ key: s.key_fr, value: s.value })),
    ar: specs.filter(s => s.key_ar || s.value).map(s => ({ key: s.key_ar, value: s.value })),
  };
  return JSON.stringify(result);
}

export function AdminMachinesPage() {
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MachineItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MachineItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [machinesRes, categoriesRes] = await Promise.all([
        fetch('/api/machines?limit=100&status=all', { headers: ADMIN_HEADERS }),
        fetch('/api/categories', { headers: ADMIN_HEADERS }),
      ]);
      if (machinesRes.ok) {
        const data = await machinesRes.json();
        setMachines(data.data || []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.data || []);
      }
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: MachineItem) => {
    const name = parseJsonField(item.name);
    const description = parseJsonField(item.description);
    const shortDesc = parseJsonField(item.shortDesc);
    setEditItem(item);
    setForm({
      name_en: name.en || '',
      name_fr: name.fr || '',
      name_ar: name.ar || '',
      description_en: description.en || '',
      description_fr: description.fr || '',
      description_ar: description.ar || '',
      shortDesc_en: shortDesc.en || '',
      shortDesc_fr: shortDesc.fr || '',
      shortDesc_ar: shortDesc.ar || '',
      slug: item.slug,
      categoryId: item.categoryId || '',
      machineType: item.machineType || '',
      capacity: item.capacity || '',
      basePrice: item.basePrice ? String(item.basePrice) : '',
      currency: item.currency,
      images: (() => {
        try { return JSON.parse(item.images || '[]'); } catch { return []; }
      })(),
      coverImage: item.coverImage || '',
      pdfUrl: item.pdfUrl || '',
      specs: parseSpecs(item.specs),
      status: item.status,
      featured: item.featured,
      order: item.order,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name_en) {
      toast.error('English name is required');
      return;
    }
    setSaving(true);
    try {
      const slug = editItem
        ? (form.slug || generateSlug(form.name_en))
        : generateSlug(form.name_en);

      const body = {
        name: buildJsonField({ en: form.name_en, fr: form.name_fr, ar: form.name_ar }),
        slug,
        description: buildJsonField({ en: form.description_en, fr: form.description_fr, ar: form.description_ar }),
        shortDesc: buildJsonField({ en: form.shortDesc_en, fr: form.shortDesc_fr, ar: form.shortDesc_ar }),
        categoryId: form.categoryId || null,
        machineType: form.machineType || null,
        capacity: form.capacity || null,
        basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
        currency: form.currency,
        images: JSON.stringify(form.images),
        coverImage: form.coverImage || null,
        pdfUrl: form.pdfUrl || null,
        specs: buildSpecs(form.specs),
        status: form.status,
        featured: form.featured,
        order: form.order,
      };

      const url = editItem
        ? `/api/machines/${editItem.slug}`
        : '/api/machines';
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editItem ? 'Machine updated' : 'Machine created');
        setShowForm(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/machines/${deleteItem.slug}`, {
        method: 'DELETE',
        headers: ADMIN_HEADERS,
      });
      if (res.ok) {
        toast.success('Machine deleted');
        setDeleteItem(null);
        fetchData();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleToggleFeatured = async (item: MachineItem) => {
    try {
      const res = await fetch(`/api/machines/${item.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({ featured: !item.featured }),
      });
      if (res.ok) {
        toast.success(item.featured ? 'Removed from featured' : 'Added to featured');
        fetchData();
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const filteredMachines = machines.filter((m) => {
    if (!search) return true;
    const name = getLocalizedValue(m.name, 'fr').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const updateForm = (key: keyof FormData, value: string | boolean | number | SpecItem[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addSpec = () => {
    setForm((prev) => ({
      ...prev,
      specs: [...prev.specs, { key_en: '', key_fr: '', key_ar: '', value: '' }],
    }));
  };

  const removeSpec = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  };

  const updateSpec = (index: number, field: keyof SpecItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Machines</h1>
          <p className="text-muted-foreground">Manage your machine inventory</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Add Machine
        </Button>
      </div>

      <Input
        placeholder="Search machines..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No machines found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMachines.map((machine) => {
                    let thumb = '';
                    try {
                      const imgs = JSON.parse(machine.images || '[]');
                      if (imgs[0]) thumb = imgs[0];
                    } catch { /* empty */ }
                    return (
                      <TableRow key={machine.id}>
                        <TableCell>
                          {thumb ? (
                            <img src={thumb} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No img
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getLocalizedValue(machine.name, 'fr')}
                        </TableCell>
                        <TableCell>
                          {machine.category ? getLocalizedValue(machine.category.name, 'fr') : '-'}
                        </TableCell>
                        <TableCell>
                          {machine.basePrice
                            ? `${Number(machine.basePrice).toLocaleString()} ${machine.currency}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={machine.status === 'published' ? 'default' : 'secondary'}>
                            {machine.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={machine.featured}
                            onCheckedChange={() => handleToggleFeatured(machine)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(machine)} className="cursor-pointer">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteItem(machine)} className="cursor-pointer text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Machine' : 'Add Machine'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="space-y-4 pb-4">
              {/* Name tabs */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-2">
                    <TabsTrigger value="fr">FR</TabsTrigger>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="ar">AR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fr">
                    <Input value={form.name_fr} onChange={(e) => updateForm('name_fr', e.target.value)} placeholder="Nom en français" />
                  </TabsContent>
                  <TabsContent value="en">
                    <Input value={form.name_en} onChange={(e) => updateForm('name_en', e.target.value)} placeholder="Name in English" />
                  </TabsContent>
                  <TabsContent value="ar">
                    <Input value={form.name_ar} onChange={(e) => updateForm('name_ar', e.target.value)} placeholder="الاسم بالعربية" dir="rtl" />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Description tabs */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-2">
                    <TabsTrigger value="fr">FR</TabsTrigger>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="ar">AR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fr">
                    <Textarea value={form.description_fr} onChange={(e) => updateForm('description_fr', e.target.value)} placeholder="Description en français" rows={4} />
                  </TabsContent>
                  <TabsContent value="en">
                    <Textarea value={form.description_en} onChange={(e) => updateForm('description_en', e.target.value)} placeholder="Description in English" rows={4} />
                  </TabsContent>
                  <TabsContent value="ar">
                    <Textarea value={form.description_ar} onChange={(e) => updateForm('description_ar', e.target.value)} placeholder="الوصف بالعربية" rows={4} dir="rtl" />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Short Description tabs */}
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Tabs defaultValue="fr">
                  <TabsList className="mb-2">
                    <TabsTrigger value="fr">FR</TabsTrigger>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="ar">AR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fr">
                    <Textarea value={form.shortDesc_fr} onChange={(e) => updateForm('shortDesc_fr', e.target.value)} placeholder="Courte description" rows={2} />
                  </TabsContent>
                  <TabsContent value="en">
                    <Textarea value={form.shortDesc_en} onChange={(e) => updateForm('shortDesc_en', e.target.value)} placeholder="Short description" rows={2} />
                  </TabsContent>
                  <TabsContent value="ar">
                    <Textarea value={form.shortDesc_ar} onChange={(e) => updateForm('shortDesc_ar', e.target.value)} placeholder="وصف قصير" rows={2} dir="rtl" />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} placeholder="machine-slug" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => updateForm('categoryId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getLocalizedValue(cat.name, 'fr')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Machine Type</Label>
                  <Input value={form.machineType} onChange={(e) => updateForm('machineType', e.target.value)} placeholder="CNC, Press, Lathe..." />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} placeholder="100 tons, 500mm..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" value={form.basePrice} onChange={(e) => updateForm('basePrice', e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => updateForm('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DZD">DZD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input type="number" value={String(form.order)} onChange={(e) => updateForm('order', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <ImageGalleryUpload
                images={form.images}
                onChange={(urls) => updateForm('images', urls)}
                label="Gallery Images"
                folder="machines"
              />

              <ImageUpload
                value={form.coverImage}
                onChange={(url) => updateForm('coverImage', url)}
                label="Cover Image"
                placeholder="Upload or paste cover image URL"
                folder="machines"
                previewClassName="h-32 w-full"
              />

              <ImageUpload
                value={form.pdfUrl}
                onChange={(url) => updateForm('pdfUrl', url)}
                label="PDF Catalog (Optional)"
                placeholder="Upload or paste PDF URL"
                folder="documents"
                accept="application/pdf"
              />
              {form.pdfUrl && (
                <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  View PDF Catalog
                </a>
              )}

              {/* Specifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Specifications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSpec} className="cursor-pointer">
                    <Plus className="h-3 w-3 mr-1" /> Add Spec
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add key-value specifications (e.g., &quot;Weight&quot;: &quot;500kg&quot;). Keys support FR/EN/AR translations.
                </p>

                {form.specs.length > 0 && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                          <span>Key (EN)</span>
                          <span>Key (FR)</span>
                          <span>Key (AR)</span>
                          <span>Value</span>
                          <span className="w-8"></span>
                        </div>
                        {form.specs.map((spec, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 items-center">
                            <Input
                              value={spec.key_en}
                              onChange={(e) => updateSpec(i, 'key_en', e.target.value)}
                              placeholder="Key in English"
                              className="h-8 text-sm"
                            />
                            <Input
                              value={spec.key_fr}
                              onChange={(e) => updateSpec(i, 'key_fr', e.target.value)}
                              placeholder="Clé en français"
                              className="h-8 text-sm"
                            />
                            <Input
                              value={spec.key_ar}
                              onChange={(e) => updateSpec(i, 'key_ar', e.target.value)}
                              placeholder="المفتاح"
                              className="h-8 text-sm"
                              dir="rtl"
                            />
                            <Input
                              value={spec.value}
                              onChange={(e) => updateSpec(i, 'value', e.target.value)}
                              placeholder="Value"
                              className="h-8 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 cursor-pointer text-destructive hover:text-destructive"
                              onClick={() => removeSpec(i)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {form.specs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                    No specifications added yet
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.featured} onCheckedChange={(v) => updateForm('featured', v)} />
                  <Label>Featured</Label>
                </div>
                <div className="space-y-0">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => updateForm('status', v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving} className="cursor-pointer">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem ? getLocalizedValue(deleteItem.name, 'fr') : ''}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="cursor-pointer bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
