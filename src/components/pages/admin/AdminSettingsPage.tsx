'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { invalidateSettingsCache } from '@/hooks/use-site-settings';

const ADMIN_HEADERS = { Authorization: 'Bearer admin-token' };

interface SettingsData {
  [key: string]: string;
}

const DEFAULT_SETTINGS: Record<string, string> = {
  company_name_en: '',
  company_name_fr: 'LA SOURCE MACHIEN',
  company_name_ar: '',
  company_description_en: '',
  company_description_fr: '',
  company_description_ar: '',
  company_phone: '+213 23 45 67 89',
  company_email: 'contact@lasourcemachien.dz',
  company_whatsapp: '+213 555 123 456',
  company_address: 'Zone Industrielle, Rouiba, Alger, Algeria',
  company_website: 'https://www.lasourcemachien.dz',
  social_facebook: 'https://www.facebook.com/lasourcemachien',
  social_linkedin: 'https://www.linkedin.com/company/lasourcemachien',
  social_instagram: '',
  social_youtube: '',
  social_twitter: '',
  working_hours_en: 'Sunday - Thursday: 8:00 AM - 5:00 PM',
  working_hours_fr: 'Dimanche - Jeudi : 8h00 - 17h00',
  working_hours_ar: 'الأحد – الخميس: 8:00 ص – 5:00 م',
  seo_title_en: '',
  seo_title_fr: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_fr: '',
  seo_description_ar: '',
  seo_og_image: '',
  google_maps_api_key: '',
  google_analytics_id: '',
  recaptcha_site_key: '',
  recaptcha_secret_key: '',
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { headers: ADMIN_HEADERS });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...(data.data || {}) });
      }
    } catch {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
        // Invalidate cache so all pages immediately use new settings
        invalidateSettingsCache();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage your site configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All
        </Button>
      </div>

      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="space-y-8 pr-4 pb-8">

          {/* Company Information */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Tabs defaultValue="fr">
                <TabsList className="mb-2">
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                  <Input value={settings.company_name_fr || ''} onChange={(e) => updateSetting('company_name_fr', e.target.value)} placeholder="Nom de l'entreprise" />
                </TabsContent>
                <TabsContent value="en">
                  <Input value={settings.company_name_en || ''} onChange={(e) => updateSetting('company_name_en', e.target.value)} placeholder="Company name" />
                </TabsContent>
                <TabsContent value="ar">
                  <Input value={settings.company_name_ar || ''} onChange={(e) => updateSetting('company_name_ar', e.target.value)} placeholder="اسم الشركة" dir="rtl" />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Company Description</Label>
              <Tabs defaultValue="fr">
                <TabsList className="mb-2">
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                  <Textarea value={settings.company_description_fr || ''} onChange={(e) => updateSetting('company_description_fr', e.target.value)} placeholder="Description de l'entreprise" rows={3} />
                </TabsContent>
                <TabsContent value="en">
                  <Textarea value={settings.company_description_en || ''} onChange={(e) => updateSetting('company_description_en', e.target.value)} placeholder="Company description" rows={3} />
                </TabsContent>
                <TabsContent value="ar">
                  <Textarea value={settings.company_description_ar || ''} onChange={(e) => updateSetting('company_description_ar', e.target.value)} placeholder="وصف الشركة" rows={3} dir="rtl" />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={settings.company_phone || ''} onChange={(e) => updateSetting('company_phone', e.target.value)} placeholder="+213 23 45 67 89" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={settings.company_email || ''} onChange={(e) => updateSetting('company_email', e.target.value)} placeholder="contact@example.dz" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={settings.company_whatsapp || ''} onChange={(e) => updateSetting('company_whatsapp', e.target.value)} placeholder="+213 555 123 456" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={settings.company_website || ''} onChange={(e) => updateSetting('company_website', e.target.value)} placeholder="https://www.example.dz" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={settings.company_address || ''} onChange={(e) => updateSetting('company_address', e.target.value)} placeholder="Company address" />
            </div>
          </section>

          <Separator />

          {/* Social Links */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={settings.social_facebook || ''} onChange={(e) => updateSetting('social_facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input value={settings.social_linkedin || ''} onChange={(e) => updateSetting('social_linkedin', e.target.value)} placeholder="https://linkedin.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={settings.social_instagram || ''} onChange={(e) => updateSetting('social_instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input value={settings.social_youtube || ''} onChange={(e) => updateSetting('social_youtube', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input value={settings.social_twitter || ''} onChange={(e) => updateSetting('social_twitter', e.target.value)} placeholder="https://twitter.com/..." />
              </div>
            </div>
          </section>

          <Separator />

          {/* Working Hours */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Working Hours</h2>
            <div className="space-y-2">
              <Tabs defaultValue="fr">
                <TabsList className="mb-2">
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                  <Input value={settings.working_hours_fr || ''} onChange={(e) => updateSetting('working_hours_fr', e.target.value)} placeholder="Dimanche - Jeudi : 8h00 - 17h00" />
                </TabsContent>
                <TabsContent value="en">
                  <Input value={settings.working_hours_en || ''} onChange={(e) => updateSetting('working_hours_en', e.target.value)} placeholder="Sunday - Thursday: 8:00 AM - 5:00 PM" />
                </TabsContent>
                <TabsContent value="ar">
                  <Input value={settings.working_hours_ar || ''} onChange={(e) => updateSetting('working_hours_ar', e.target.value)} placeholder="الأحد – الخميس: 8:00 ص – 5:00 م" dir="rtl" />
                </TabsContent>
              </Tabs>
            </div>
          </section>

          <Separator />

          {/* SEO Meta */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">SEO & Meta</h2>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Tabs defaultValue="fr">
                <TabsList className="mb-2">
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                  <Input value={settings.seo_title_fr || ''} onChange={(e) => updateSetting('seo_title_fr', e.target.value)} placeholder="Meta title" />
                </TabsContent>
                <TabsContent value="en">
                  <Input value={settings.seo_title_en || ''} onChange={(e) => updateSetting('seo_title_en', e.target.value)} placeholder="Meta title" />
                </TabsContent>
                <TabsContent value="ar">
                  <Input value={settings.seo_title_ar || ''} onChange={(e) => updateSetting('seo_title_ar', e.target.value)} placeholder="عنوان الميتا" dir="rtl" />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Tabs defaultValue="fr">
                <TabsList className="mb-2">
                  <TabsTrigger value="fr">FR</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ar">AR</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                  <Textarea value={settings.seo_description_fr || ''} onChange={(e) => updateSetting('seo_description_fr', e.target.value)} placeholder="Meta description" rows={2} />
                </TabsContent>
                <TabsContent value="en">
                  <Textarea value={settings.seo_description_en || ''} onChange={(e) => updateSetting('seo_description_en', e.target.value)} placeholder="Meta description" rows={2} />
                </TabsContent>
                <TabsContent value="ar">
                  <Textarea value={settings.seo_description_ar || ''} onChange={(e) => updateSetting('seo_description_ar', e.target.value)} placeholder="وصف الميتا" rows={2} dir="rtl" />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>OG Image URL</Label>
              <Input value={settings.seo_og_image || ''} onChange={(e) => updateSetting('seo_og_image', e.target.value)} placeholder="https://example.com/og-image.jpg" />
            </div>
          </section>

          <Separator />

          {/* Integrations */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Google Maps API Key</Label>
                <Input value={settings.google_maps_api_key || ''} onChange={(e) => updateSetting('google_maps_api_key', e.target.value)} placeholder="AIza..." />
              </div>
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input value={settings.google_analytics_id || ''} onChange={(e) => updateSetting('google_analytics_id', e.target.value)} placeholder="G-XXXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>reCAPTCHA Site Key</Label>
                <Input value={settings.recaptcha_site_key || ''} onChange={(e) => updateSetting('recaptcha_site_key', e.target.value)} placeholder="6Lc..." />
              </div>
              <div className="space-y-2">
                <Label>reCAPTCHA Secret Key</Label>
                <Input type="password" value={settings.recaptcha_secret_key || ''} onChange={(e) => updateSetting('recaptcha_secret_key', e.target.value)} placeholder="6Lc..." />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Settings
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
