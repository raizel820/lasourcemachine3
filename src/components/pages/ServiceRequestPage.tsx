'use client';

import { useState, useEffect } from 'react';
import { Wrench, Check, Plus, X, PackageSearch, Loader2, Send, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue } from '@/lib/helpers';
import type { Service } from '@/lib/types';
import type { Machine } from '@/lib/types';

export function ServiceRequestPage() {
  const { locale, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [machineSearch, setMachineSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceId: '',
    selectedMachines: [] as string[],
    customMachines: [] as string[],
    customMachineInput: '',
    note: '',
  });

  // Fetch services and machines on mount
  useEffect(() => {
    setDataLoading(true);

    Promise.allSettled([
      fetch('/api/services?limit=50').then((r) => r.json()),
      fetch('/api/machines?status=published&limit=100').then((r) => r.json()),
    ]).then(([servicesRes, machinesRes]) => {
      if (servicesRes.status === 'fulfilled' && servicesRes.value.data) {
        setServices(servicesRes.value.data);
      }
      if (machinesRes.status === 'fulfilled' && machinesRes.value.data) {
        setMachines(machinesRes.value.data);
      }
      setDataLoading(false);
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMachine = (machineId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedMachines: prev.selectedMachines.includes(machineId)
        ? prev.selectedMachines.filter((id) => id !== machineId)
        : [...prev.selectedMachines, machineId],
    }));
  };

  const addCustomMachine = () => {
    const trimmed = formData.customMachineInput.trim();
    if (!trimmed) return;
    if (formData.customMachines.some(
      (m) => m.toLowerCase() === trimmed.toLowerCase()
    )) {
      toast.error(
        locale === 'ar'
          ? 'هذه الآلة مضافة بالفعل'
          : locale === 'fr'
            ? 'Cette machine est déjà ajoutée'
            : 'This machine is already added'
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customMachines: [...prev.customMachines, trimmed],
      customMachineInput: '',
    }));
  };

  const removeCustomMachine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customMachines: prev.customMachines.filter((_, i) => i !== index),
    }));
  };

  const handleCustomMachineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomMachine();
    }
  };

  const getSelectedMachineNames = () => {
    return machines
      .filter((m) => formData.selectedMachines.includes(m.id))
      .map((m) => getLocalizedValue(m.name, locale))
      .join(', ');
  };

  const getSelectedServiceName = () => {
    const svc = services.find((s) => s.id === formData.serviceId);
    return svc ? getLocalizedValue(svc.title || svc.name, locale) : '';
  };

  const hasAnyMachines = formData.selectedMachines.length > 0 || formData.customMachines.length > 0;

  const filteredMachines = machineSearch.trim()
    ? machines.filter((m) =>
        getLocalizedValue(m.name, locale).toLowerCase().includes(machineSearch.toLowerCase())
      )
    : machines;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.serviceId) {
      toast.error(
        locale === 'ar'
          ? 'يرجى ملء الاسم والبريد الإلكتروني واختيار خدمة'
          : locale === 'fr'
            ? 'Veuillez remplir le nom, l\'email et sélectionner un service'
            : 'Please fill in your name, email, and select a service'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const machineNames = getSelectedMachineNames();
      const serviceName = getSelectedServiceName();

      const parts: string[] = [];
      if (formData.selectedMachines.length > 0) {
        parts.push(`${t.services.selectedFromList}: ${machineNames}`);
      }
      if (formData.customMachines.length > 0) {
        parts.push(`${t.services.customAdded}: ${formData.customMachines.join(', ')}`);
      }
      if (formData.note) parts.push(`${t.services.note}: ${formData.note}`);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          subject: `${t.services.serviceRequestSubject}: ${serviceName}`,
          message: parts.length > 0 ? parts.join('\n\n') : `Service request for: ${serviceName}`,
          serviceId: formData.serviceId || undefined,
          selectedMachineIds: formData.selectedMachines.length > 0
            ? JSON.stringify(formData.selectedMachines)
            : undefined,
          customMachines: formData.customMachines.length > 0
            ? formData.customMachines.join(', ')
            : undefined,
          machineInterest: machineNames || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast.success(t.contact.success);
      setIsSubmitted(true);
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRTL = locale === 'ar';

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-3">
            {locale === 'ar' ? 'تم إرسال طلبك بنجاح!' : locale === 'fr' ? 'Votre demande a été envoyée avec succès !' : 'Your request has been submitted successfully!'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {locale === 'ar'
              ? 'سنتواصل معك في أقرب وقت ممكن. شكراً لثقتكم بنا.'
              : locale === 'fr'
                ? 'Nous vous contacterons dans les plus brefs délais. Merci de votre confiance.'
                : 'We will get back to you as soon as possible. Thank you for your trust.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setCurrentPage('home')} className="cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
              {locale === 'ar' ? 'العودة للرئيسية' : locale === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
            </Button>
            <Button variant="outline" onClick={() => {
              setIsSubmitted(false);
              setFormData({
                name: '', email: '', phone: '', company: '', serviceId: '',
                selectedMachines: [], customMachines: [], customMachineInput: '', note: '',
              });
            }} className="cursor-pointer">
              {locale === 'ar' ? 'طلب خدمة آخر' : locale === 'fr' ? 'Nouvelle demande' : 'New Request'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.services.requestService}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t.services.subtitle}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Step 1: Customer Information */}
              <Card>
                <CardContent className="p-6 lg:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</div>
                    <h2 className="text-lg font-semibold">
                      {locale === 'ar' ? 'المعلومات الشخصية' : locale === 'fr' ? 'Informations Personnelles' : 'Customer Information'}
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="svc-name">
                        {t.contact.name} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="svc-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={t.contact.name}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="svc-email">
                        {t.contact.email} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="svc-email"
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
                      <Label htmlFor="svc-phone">{t.contact.phone}</Label>
                      <Input
                        id="svc-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={t.contact.phone}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="svc-company">{t.contact.company}</Label>
                      <Input
                        id="svc-company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder={t.contact.company}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Service Selection */}
              <Card>
                <CardContent className="p-6 lg:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</div>
                    <h2 className="text-lg font-semibold">
                      {locale === 'ar' ? 'اختيار الخدمة' : locale === 'fr' ? 'Sélection du Service' : 'Service Selection'}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t.services.selectService} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.serviceId}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, serviceId: val }))
                      }
                      disabled={isSubmitting || dataLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.services.selectServicePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {getLocalizedValue(service.title || service.name, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Machines */}
              <Card>
                <CardContent className="p-6 lg:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</div>
                    <h2 className="text-lg font-semibold">{t.services.interestedMachines}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                      ? '(اختياري - اختر الآلات المرتبطة بطلب الخدمة)'
                      : locale === 'fr'
                        ? '(Optionnel - Sélectionnez les machines liées à la demande de service)'
                        : '(Optional — select machines related to this service request)'}
                  </p>

                  <Separator />

                  {/* Machines from catalog */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t.services.selectedFromList}</p>
                    {dataLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.common.loading}
                      </div>
                    ) : machines.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-3">
                        {locale === 'ar' ? 'لا توجد آلات متاحة' : locale === 'fr' ? 'Aucune machine disponible' : 'No machines available'}
                      </p>
                    ) : (
                      <>
                        {machines.length > 6 && (
                          <Input
                            value={machineSearch}
                            onChange={(e) => setMachineSearch(e.target.value)}
                            placeholder={
                              locale === 'ar' ? 'البحث في الآلات...' : locale === 'fr' ? 'Rechercher une machine...' : 'Search machines...'
                            }
                            disabled={isSubmitting}
                            className="max-w-xs"
                          />
                        )}
                        <div className="rounded-lg border bg-muted/30 p-3 max-h-64 overflow-y-auto">
                          <div className="space-y-1">
                            {filteredMachines.map((machine) => {
                              const machineName = getLocalizedValue(machine.name, locale);
                              const isSelected = formData.selectedMachines.includes(machine.id);
                              return (
                                <label
                                  key={machine.id}
                                  className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-primary/5 border border-primary/20'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleMachine(machine.id)}
                                    disabled={isSubmitting}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{machineName}</p>
                                    {machine.category && (
                                      <p className="text-[11px] text-muted-foreground">
                                        {getLocalizedValue(machine.category.name, locale)}
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <Check className={`h-4 w-4 text-primary shrink-0 ${isRTL ? 'ml-auto' : ''}`} />
                                  )}
                                </label>
                              );
                            })}
                            {filteredMachines.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-3">
                                {locale === 'ar' ? 'لا توجد نتائج' : locale === 'fr' ? 'Aucun résultat' : 'No results'}
                              </p>
                            )}
                          </div>
                          {formData.selectedMachines.length > 0 && (
                            <div className="mt-2 pt-2 border-t flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {formData.selectedMachines.length} {locale === 'ar' ? 'آلة محددة' : locale === 'fr' ? 'machine(s) sélectionnée(s)' : 'machine(s) selected'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Custom Machines */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t.services.customAdded}</p>
                    <div className="rounded-lg border border-dashed bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <PackageSearch className="h-3.5 w-3.5 shrink-0" />
                        <span>{t.services.customMachinesHint}</span>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={formData.customMachineInput}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, customMachineInput: e.target.value }))
                          }
                          onKeyDown={handleCustomMachineKeyDown}
                          placeholder={t.services.customMachinesPlaceholder}
                          disabled={isSubmitting}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomMachine}
                          disabled={isSubmitting || !formData.customMachineInput.trim()}
                          className="shrink-0 cursor-pointer"
                        >
                          <Plus className="h-4 w-4 rtl:mr-0 rtl:ml-1 rtl:rotate-180 mr-1" />
                          {t.services.addMachine}
                        </Button>
                      </div>

                      {formData.customMachines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.customMachines.map((machine, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="flex items-center gap-1 py-1 px-2.5 text-xs"
                            >
                              <span>{machine}</span>
                              <button
                                type="button"
                                onClick={() => removeCustomMachine(i)}
                                disabled={isSubmitting}
                                className="hover:text-destructive transition-colors cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Machine summary */}
                  {hasAnyMachines && (
                    <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                      <p className="text-xs font-medium text-primary mb-1">
                        {locale === 'ar' ? 'ملخص الآلات' : locale === 'fr' ? 'Résumé des machines' : 'Machine Summary'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.selectedMachines.length > 0 && (
                          <span>
                            {formData.selectedMachines.length} {locale === 'ar' ? 'من الكتالوج' : locale === 'fr' ? 'du catalogue' : 'from catalog'}
                            {formData.customMachines.length > 0 && ' + '}
                          </span>
                        )}
                        {formData.customMachines.length > 0 && (
                          <span>
                            {formData.customMachines.length} {locale === 'ar' ? 'مخصصة' : locale === 'fr' ? 'personnalisée(s)' : 'custom'}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 4: Note */}
              <Card>
                <CardContent className="p-6 lg:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">4</div>
                    <h2 className="text-lg font-semibold">
                      {locale === 'ar' ? 'ملاحظات إضافية' : locale === 'fr' ? 'Notes Supplémentaires' : 'Additional Notes'}
                    </h2>
                  </div>
                  <Textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t.services.notePlaceholder}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-10 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                      {t.services.requestService}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
