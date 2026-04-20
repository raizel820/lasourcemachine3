'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue } from '@/lib/helpers';
import type { Service } from '@/lib/types';
import type { Machine } from '@/lib/types';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
}

export function ServiceRequestModal({
  isOpen,
  onClose,
  preselectedServiceId,
}: ServiceRequestModalProps) {
  const { locale } = useAppStore();
  const t = getTranslations(locale);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceId: '',
    selectedMachines: [] as string[],
    note: '',
  });

  // Fetch services and machines on mount
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  // Set preselected service
  useEffect(() => {
    if (preselectedServiceId && isOpen) {
      setFormData((prev) => ({ ...prev, serviceId: preselectedServiceId }));
    }
  }, [preselectedServiceId, isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        serviceId: '',
        selectedMachines: [],
        note: '',
      });
    }
  }, [isOpen]);

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

      // Build a comprehensive message
      const parts: string[] = [];
      if (machineNames) parts.push(`Machines: ${machineNames}`);
      if (formData.note) parts.push(`Note: ${formData.note}`);

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
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast.success(t.contact.success);
      onClose();
    } catch {
      toast.error(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isRTL = locale === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            {t.services.requestService}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t.contact.subtitle}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-5 p-6 pt-4">
            {/* Customer Information */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {locale === 'ar' ? 'المعلومات الشخصية' : locale === 'fr' ? 'Informations Personnelles' : 'Customer Information'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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
            </div>

            {/* Service Selection */}
            <div className="space-y-1.5">
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

            {/* Machine Selection */}
            <div className="space-y-2">
              <Label>{t.services.interestedMachines}</Label>
              <p className="text-xs text-muted-foreground">
                {locale === 'ar'
                  ? '(اختياري - اختر الآلات المرتبطة بطلب الخدمة)'
                  : locale === 'fr'
                    ? '(Optionnel - Sélectionnez les machines liées à la demande de service)'
                    : '(Optional — select machines related to this service request)'}
              </p>
              {dataLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.common.loading}
                </div>
              ) : machines.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {locale === 'ar' ? 'لا توجد آلات متاحة' : locale === 'fr' ? 'Aucune machine disponible' : 'No machines available'}
                </p>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {machines.map((machine) => {
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
                  </div>
                  {formData.selectedMachines.length > 0 && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formData.selectedMachines.length} {locale === 'ar' ? 'آلة محددة' : locale === 'fr' ? 'machine(s) sélectionnée(s)' : 'machine(s) selected'}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="svc-note">{t.services.note}</Label>
              <Textarea
                id="svc-note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                placeholder={t.services.notePlaceholder}
                disabled={isSubmitting}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 cursor-pointer"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.loading}
                  </>
                ) : (
                  t.services.requestService
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
