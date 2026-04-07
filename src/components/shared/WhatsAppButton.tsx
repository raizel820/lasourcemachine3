'use client';

import { MessageCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { cn } from '@/lib/utils';

export function WhatsAppButton() {
  const { isRTL } = useAppStore();
  const { whatsapp } = useSiteSettings();

  const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Hello! I am interested in your industrial machinery. Can you help me?'
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed bottom-6 z-50 flex items-center gap-2',
        isRTL ? 'left-6' : 'right-6',
        'group'
      )}
      aria-label="Chat on WhatsApp"
    >
      {/* Tooltip */}
      <span
        className={cn(
          'rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-lg',
          'opacity-0 transition-all duration-300',
          'group-hover:opacity-100',
          isRTL ? 'mr-3' : 'ml-3',
          isRTL ? 'origin-left' : 'origin-right'
        )}
      >
        Chat with us
      </span>

      {/* Button with pulse animation */}
      <span className="relative flex">
        {/* Pulse ring */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-25" />
        <span
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="h-7 w-7 fill-white" />
        </span>
      </span>
    </a>
  );
}
