'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageUpload } from '@/components/ui/image-upload';

const ADMIN_HEADERS = { Authorization: 'Bearer admin-token' };

interface Partner {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  order: number;
}

interface FormData {
  name: string;
  logo: string;
  website: string;
  order: number;
}

const emptyForm: FormData = {
  name: '',
  logo: '',
  website: '',
  order: 0,
};

export function AdminPartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Partner | null>(null);
  const [deleteItem, setDeleteItem] = useState<Partner | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/partners', { headers: ADMIN_HEADERS });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
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

  const openEdit = (item: Partner) => {
    setEditItem(item);
    setForm({
      name: item.name,
      logo: item.logo || '',
      website: item.website || '',
      order: item.order,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        logo: form.logo || null,
        website: form.website || null,
        order: form.order,
      };

      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editItem ? 'Partner updated' : 'Partner created');
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
      const res = await fetch(`/api/partners`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({ id: deleteItem.id }),
      });
      if (res.ok) {
        toast.success('Partner deleted');
        setDeleteItem(null);
        fetchData();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const updateForm = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.website || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-muted-foreground">Manage your partners and suppliers</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

      <Input
        placeholder="Search partners..."
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
                  <TableHead className="w-16">Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.logo ? (
                          <img src={item.logo} alt={item.name} className="h-10 w-16 rounded object-contain bg-white dark:bg-slate-800 p-1" />
                        ) : (
                          <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No logo
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.website ? (
                          <a href={item.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="cursor-pointer">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteItem(item)} className="cursor-pointer text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Partner name" />
            </div>
            <ImageUpload
              value={form.logo}
              onChange={(url) => updateForm('logo', url)}
              label="Logo"
              placeholder="Upload partner logo"
              folder="partners"
              previewClassName="h-20 w-28"
            />
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={String(form.order)} onChange={(e) => updateForm('order', parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving} className="cursor-pointer">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.name || ''}&quot;?
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
