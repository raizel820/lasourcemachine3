'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Calendar, User, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, formatDate } from '@/lib/helpers';
import type { NewsPost } from '@/lib/types';

export function NewsDetailPage() {
  const { locale, isRTL, currentSlug, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [post, setPost] = useState<NewsPost | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?slug=${currentSlug}`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data.data) ? data.data : (data.news || []);
          const p = arr.length > 0 ? arr[0] : null;
          setPost(p);
        }
        const allRes = await fetch('/api/news?limit=100&status=published');
        if (allRes.ok) {
          const allData = await allRes.json();
          const all = allData.data || allData.news || [];
          if (!post) setPost(all.find((p: NewsPost) => p.slug === currentSlug) || null);
          setRelatedNews(all.filter((p: NewsPost) => p.slug !== currentSlug).slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentSlug]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-40 mb-8" />
          <Skeleton className="h-96 rounded-xl mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <Newspaper className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">{t.common.noData}</p>
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setCurrentPage('news')}>
          {isRTL ? <ArrowRight className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
          {t.common.back}
        </Button>
      </div>
    );
  }

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const content = getLocalizedValue(post.content, locale);

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => setCurrentPage('news')} className="mb-6 cursor-pointer">
          <BackArrow className="mr-2 h-4 w-4" />
          {t.common.back}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {post.coverImage && (
              <div className="rounded-xl overflow-hidden mb-8">
                <img src={post.coverImage} alt={getLocalizedValue(post.title, locale)} className="w-full h-64 sm:h-96 object-cover" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {post.publishedAt && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt, locale)}
                </span>
              )}
              {post.author && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
              )}

            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-6">
              {getLocalizedValue(post.title, locale)}
            </h1>

            <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {content}
            </div>
          </div>

          {/* Sidebar - Related News */}
          {relatedNews.length > 0 && (
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold mb-6">
                {locale === 'ar' ? 'أخبار ذات صلة' : locale === 'fr' ? 'Articles Associés' : 'Related News'}
              </h3>
              <div className="space-y-4">
                {relatedNews.map((rn) => (
                  <Card key={rn.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCurrentSlug(rn.slug); window.scrollTo(0, 0); }}>
                    <div className="flex gap-4 p-3">
                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
                        {rn.coverImage ? (
                          <img src={rn.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {rn.publishedAt && (
                          <p className="text-xs text-muted-foreground mb-1">{formatDate(rn.publishedAt, locale)}</p>
                        )}
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                          {getLocalizedValue(rn.title, locale)}
                        </h4>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
