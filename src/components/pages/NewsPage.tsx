'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Newspaper, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, truncateText, formatDate } from '@/lib/helpers';
import type { NewsPost } from '@/lib/types';

export function NewsPage() {
  const { locale, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/news?limit=100&status=published');
        if (res.ok) {
          const data = await res.json();
          setNews(data.data || data.news || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredNews = news.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = getLocalizedValue(post.title, locale).toLowerCase();
    const author = (post.author || '').toLowerCase();
    return title.includes(q) || author.includes(q);
  });

  const handleReadMore = (post: NewsPost) => {
    setCurrentSlug(post.slug);
    setCurrentPage('news-detail');
  };

  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.news.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t.news.subtitle}</p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-8 p-4 rounded-xl bg-muted/30 border">
            <div className="relative max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map((post) => (
                <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleReadMore(post)}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={getLocalizedValue(post.title, locale)} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Newspaper className="h-10 w-10 text-primary/30" />
                      </div>
                    )}

                  </div>
                  <CardContent className="pt-4 px-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.publishedAt, locale)}
                        </span>
                      )}
                      {post.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base leading-tight mb-2 group-hover:text-primary transition-colors">
                      {getLocalizedValue(post.title, locale)}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {truncateText(getLocalizedValue(post.excerpt, locale), 120)}
                      </p>
                    )}
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      {t.news.readMore} →
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{locale === 'ar' ? 'لا توجد أخبار حالياً' : locale === 'fr' ? 'Aucune actualité disponible' : 'No news available'}</p>
              <p className="text-sm mt-1">{locale === 'ar' ? 'ترقبوا المزيد قريباً' : locale === 'fr' ? 'Revenez bientôt' : 'Check back soon'}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
