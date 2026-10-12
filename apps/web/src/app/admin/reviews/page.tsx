'use client';

import React, { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, MessageSquare, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
  barber: { name: string };
  client: { name: string; phone: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<ReviewItem[]>('/api/v1/admin/reviews');
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await adminFetch(`/api/v1/admin/reviews/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !current }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isPublic: !current } : r))
      );
    } catch (err) {
      alert('Ошибка при изменении видимости отзыва');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Отзывы клиентов</h1>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Модерация оценок и отзывов, публикуемых на сайте и в приложении
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
          <div>Загрузка отзывов...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          <div>Отзывов пока нет</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map((r) => {
            const dateStr = new Date(r.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={r.id}
                style={{
                  background: '#12141a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          fill={star <= r.rating ? '#d4af37' : 'none'}
                          color={star <= r.rating ? '#d4af37' : '#4b5563'}
                        />
                      ))}
                    </div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{r.client.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.client.phone}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#d4af37', marginTop: '4px' }}>
                    Мастер: {r.barber.name}
                  </div>

                  {r.comment && (
                    <p style={{ fontSize: '0.88rem', color: '#e5e7eb', marginTop: '8px', lineHeight: 1.5 }}>
                      «{r.comment}»
                    </p>
                  )}

                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '8px' }}>
                    {dateStr}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: r.isPublic ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                    color: r.isPublic ? '#10b981' : '#9ca3af'
                  }}>
                    {r.isPublic ? 'Опубликован на сайте' : 'Скрыт'}
                  </span>

                  <button
                    onClick={() => handleToggleVisibility(r.id, r.isPublic)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: r.isPublic ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: 'none',
                      color: r.isPublic ? '#ef4444' : '#10b981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    {r.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                    {r.isPublic ? 'Скрыть' : 'Опубликовать'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
