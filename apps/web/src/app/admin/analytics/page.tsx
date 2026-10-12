'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Scissors, XCircle, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface AnalyticsData {
  periodDays: number;
  totalBookings: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  averageCheck: number;
  barberWorkload: Array<{ name: string; bookingsCount: number; revenue: number }>;
  popularServices: Array<{ name: string; count: number; revenue: number }>;
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<number>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminFetch<AnalyticsData>(`/api/v1/admin/analytics?days=${period}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Бизнес-аналитика</h1>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Показатели выручки, популярности услуг и загрузки барберов
          </p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', background: '#12141a', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === days ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: period === days ? '#d4af37' : '#9ca3af',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {days} дней
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 10px' }} />
          <div>Расчет аналитических показателей...</div>
        </div>
      ) : !data ? (
        <div style={{ color: '#ef4444' }}>Не удалось загрузить аналитику</div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#12141a', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                <span>ОБЩАЯ ВЫРУЧКА</span>
                <DollarSign size={18} color="#d4af37" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d4af37', marginTop: '6px' }}>
                {data.totalRevenue.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                За выбранный период ({data.periodDays} дн.)
              </div>
            </div>

            <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                <span>СРЕДНИЙ ЧЕК</span>
                <TrendingUp size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                {data.averageCheck.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                По завершенным визитам
              </div>
            </div>

            <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                <span>ВСЕГО ВИЗИТОВ</span>
                <Users size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                {data.completedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                Успешно обслужено
              </div>
            </div>

            <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
                <span>ОТМЕНЫ</span>
                <XCircle size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>
                {data.cancelledCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                {data.totalBookings > 0 ? Math.round((data.cancelledCount / data.totalBookings) * 100) : 0}% от всех записей
              </div>
            </div>
          </div>

          {/* Detailed breakdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Barber Performance */}
            <div style={{ background: '#12141a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Загрузка и выручка барберов</h3>

              {data.barberWorkload.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Нет данных за этот период</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.barberWorkload.map((b) => (
                    <div key={b.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{b.name}</span>
                        <span style={{ color: '#d4af37', fontWeight: 700 }}>
                          {b.revenue.toLocaleString('ru-RU')} ₽ ({b.bookingsCount} визитов)
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${data.totalRevenue > 0 ? Math.min(100, Math.round((b.revenue / data.totalRevenue) * 100)) : 0}%`,
                          background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Services Ranking */}
            <div style={{ background: '#12141a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Популярные услуги</h3>

              {data.popularServices.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Нет данных за этот период</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.popularServices.map((s, idx) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 10px', background: '#090a0d', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{s.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{s.revenue.toLocaleString('ru-RU')} ₽</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.count} заказов</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
