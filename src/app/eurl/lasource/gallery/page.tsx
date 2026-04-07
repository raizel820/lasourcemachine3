'use client';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import AdminGalleryPage from './AdminGalleryPageContent';

export default function GalleryPage() {
  return (
    <AdminAuthGuard>
      <AdminGalleryPage />
    </AdminAuthGuard>
  );
}
