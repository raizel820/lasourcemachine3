'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Loader2, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { COMPANY } from '@/lib/constants';
import { getGoogleMapsEmbedUrl } from '@/lib/helpers';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function ContactPage() {
  const { locale, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const site = useSiteSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : locale === 'fr' ? 'Veuillez remplir tous les champs requis' : 'Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t.contact.success);
      setFormData({ name: '', email: '', phone: '', company: '', subject: '', message: '' });
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Phone, label: locale === 'ar' ? 'الهاتف' : locale === 'fr' ? 'Téléphone' : 'Phone', value: site.phone, href: `tel:${site.phone}` },
    { icon: Mail, label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: locale === 'ar' ? 'العنوان' : locale === 'fr' ? 'Adresse' : 'Address', value: site.address, href: `https://maps.google.com/?q=${encodeURIComponent(site.address)}` },
    { icon: Clock, label: locale === 'ar' ? 'ساعات العمل' : locale === 'fr' ? 'Heures de travail' : 'Working Hours', value: site.workingHours(locale) },
    { icon: MessageCircle, label: 'WhatsApp', value: site.whatsapp, href: `https://wa.me/${site.whatsapp.replace(/\D/g, '')}` },
  ];

  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.contact.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t.contact.subtitle}</p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-6xl mx-auto">
            {/* Contact Info - Left */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold mb-4">
                {locale === 'ar' ? 'معلومات الاتصال' : locale === 'fr' ? 'Informations de Contact' : 'Contact Information'}
              </h2>
              <div className="space-y-4">
                {contactInfo.map((info, i) => (
                  <Card key={i} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <info.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{info.label}</p>
                        {info.href ? (
                          <a href={info.href} target={info.href.startsWith('http') ? '_blank' : undefined} rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-sm font-semibold hover:text-primary transition-colors">
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-sm font-semibold">{info.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Map */}
              <div className="rounded-xl overflow-hidden border h-64">
                <iframe
                  src={getGoogleMapsEmbedUrl(COMPANY.location.lat, COMPANY.location.lng)}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location"
                />
              </div>
            </div>

            {/* Contact Form - Right */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-xl font-bold mb-6">
                    {locale === 'ar' ? 'أرسل لنا رسالة' : locale === 'fr' ? 'Envoyez-nous un Message' : 'Send Us a Message'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">
                          {t.contact.name} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contact-name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder={t.contact.name}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">
                          {t.contact.email} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder={t.contact.email}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-phone">{t.contact.phone}</Label>
                        <Input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t.contact.phone}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-company">{t.contact.company}</Label>
                        <Input
                          id="contact-company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder={t.contact.company}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">{t.contact.subject}</Label>
                      <Input
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder={t.contact.subject}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message">
                        {t.contact.message} <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder={t.contact.message}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="flex-1 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.common.loading}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                            {t.contact.submit}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => setCurrentPage('service-request')}
                        className="flex-1 cursor-pointer"
                      >
                        <HeadphonesIcon className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                        {t.services.requestService}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
