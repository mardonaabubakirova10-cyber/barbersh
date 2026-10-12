'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';

interface BookingDetail {
  id: string;
  manageToken: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  totalDurationMin: number;
  client: {
    name: string;
    phone: string;
  };
  barber: {
    id: string;
    name: string;
    role: string;
    photoUrl: string | null;
  };
  services: {
    name: string;
    durationMin: number;
    price: number;
  }[];
}

interface BarberData {
  id: string;
  name: string;
  role: string;
}

export default function BookingManagePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [availableDays, setAvailableDays] = useState<{ date: string; hasSlots: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [daysLoading, setDaysLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load booking
  const loadBooking = useCallback(() => {
    setLoading(true);
    fetch(`/api/v1/bookings/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.data);
          setSelectedBarberId(data.data.barber.id);
        } else {
          setError(data.error || 'Запись не найдена');
        }
      })
      .catch(() => setError('Ошибка при загрузке записи'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // Load barbers for reschedule
  useEffect(() => {
    if (isRescheduling) {
      fetch('/api/v1/barbers')
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setBarbers(j.data);
        });
    }
  }, [isRescheduling]);

  // Load days when rescheduling
  useEffect(() => {
    if (!isRescheduling || !booking) return;

    const today = new Date().toISOString().split('T')[0];
    setDaysLoading(true);
    fetch(
      `/api/v1/availability/days?barberId=${selectedBarberId}&fromDate=${today}&durationMin=${booking.totalDurationMin}&days=14`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setAvailableDays(j.data);
          const firstAvailable = j.data.find((d: any) => d.hasSlots);
          if (firstAvailable) setSelectedDate(firstAvailable.date);
        }
      })
      .finally(() => setDaysLoading(false));
  }, [isRescheduling, selectedBarberId, booking]);

  // Load slots when date changes
  useEffect(() => {
    if (!isRescheduling || !booking || !selectedDate) return;

    setSlotsLoading(true);
    setSelectedTime('');
    fetch(
      `/api/v1/availability?barberId=${selectedBarberId}&date=${selectedDate}&durationMin=${booking.totalDurationMin}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setAvailableSlots(j.data.slots);
      })
      .finally(() => setSlotsLoading(false));
  }, [isRescheduling, selectedBarberId, selectedDate, booking]);

  // Cancel handler
  const handleCancel = async () => {
    if (!confirm('Вы действительно хотите отменить запись?')) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/v1/bookings/${token}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: 'Запись успешно отменена' });
        loadBooking();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Не удалось отменить запись' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Ошибка сети при отмене' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule handler
  const handleRescheduleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/v1/bookings/${token}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          barberId: selectedBarberId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: 'Запись успешно перенесена!' });
        setIsRescheduling(false);
        loadBooking();
      } else {
        setActionMessage({
          type: 'error',
          text: data.code === 'SLOT_TAKEN' ? 'Выбранное время уже занято' : data.error || 'Ошибка при переносе',
        });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Ошибка сети при переносе' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>✓ Подтверждена</span>;
      case 'CANCELLED':
        return <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>✕ Отменена</span>;
      case 'COMPLETED':
        return <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>✓ Выполнена</span>;
      default:
        return <span style={{ background: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>{status}</span>;
    }
  };

  const dayLabels: Record<number, string> = { 0: 'Вс', 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}>
        Загрузка информации о записи...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-main)', padding: 20, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 12, color: 'var(--color-gold)' }}>Запись не найдена</h2>
        <p style={{ color: 'var(--fg-secondary)', marginBottom: 24 }}>{error || 'Проверьте правильность ссылки'}</p>
        <Link href="/" style={{ padding: '12px 24px', background: 'var(--color-gold)', color: '#050505', fontWeight: 700, borderRadius: 8, textDecoration: 'none' }}>
          На главную
        </Link>
      </div>
    );
  }

  const starts = new Date(booking.startsAt);
  const formattedDate = starts.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = `${String(starts.getUTCHours()).padStart(2, '0')}:${String(starts.getUTCMinutes()).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--fg-main)', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-dark)',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5,5,5,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', fontSize: '15px', fontWeight: 700 }}>
            ← НА ГЛАВНУЮ
          </span>
        </Link>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, letterSpacing: '0.12em' }}>
          УПРАВЛЕНИЕ <span style={{ color: 'var(--color-gold)' }}>ЗАПИСЬЮ</span>
        </div>
      </header>

      <main style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
        {actionMessage && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            background: actionMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${actionMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: actionMessage.type === 'success' ? '#86efac' : '#fca5a5',
          }}>
            {actionMessage.type === 'success' ? '✓ ' : '⚠️ '}
            {actionMessage.text}
          </div>
        )}

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '32px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-dark)', paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Бронирование</span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginTop: 4 }}>Запись #{booking.id.slice(0, 8)}</h1>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gap: 16, fontSize: 15, marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg-secondary)' }}>Клиент:</span>
              <strong>{booking.client.name} ({booking.client.phone})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg-secondary)' }}>Мастер:</span>
              <strong>{booking.barber.name} ({booking.barber.role})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg-secondary)' }}>Дата и время:</span>
              <strong style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}>{formattedDate} в {formattedTime}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg-secondary)' }}>Длительность:</span>
              <span>{booking.totalDurationMin} минут</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 16, marginTop: 4 }}>
              <span style={{ color: 'var(--fg-secondary)', display: 'block', marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Выбранные услуги:</span>
              {booking.services.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                  <span>{s.name} ({s.durationMin} мин)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>{s.price.toLocaleString('ru-RU')} сум</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Итоговая стоимость:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}>
                {booking.totalPrice.toLocaleString('ru-RU')} сум
              </span>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'CONFIRMED' && !isRescheduling && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', borderTop: '1px solid var(--border-dark)', paddingTop: 24 }}>
              <button
                onClick={() => setIsRescheduling(true)}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: 'var(--color-gold)',
                  color: '#050505',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📅 Перенести запись
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ✕ Отменить запись
              </button>
            </div>
          )}

          {/* Reschedule Form */}
          {isRescheduling && (
            <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 24, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--color-gold)' }}>Перенос записи</h3>
                <button
                  onClick={() => setIsRescheduling(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', fontSize: 14 }}
                >
                  Отмена
                </button>
              </div>

              {/* Choose Barber */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 8 }}>Мастер:</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBarberId(b.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        background: selectedBarberId === b.id ? 'var(--color-gold)' : 'var(--bg-dark)',
                        color: selectedBarberId === b.id ? '#050505' : 'var(--fg-main)',
                        border: selectedBarberId === b.id ? 'none' : '1px solid var(--border-dark)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choose Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 8 }}>Дата:</label>
                {daysLoading ? (
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Загрузка дней...</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {availableDays.map((d) => {
                      const dt = new Date(d.date + 'T00:00:00');
                      const isSel = selectedDate === d.date;
                      return (
                        <button
                          key={d.date}
                          onClick={() => d.hasSlots && setSelectedDate(d.date)}
                          disabled={!d.hasSlots}
                          style={{
                            minWidth: 70,
                            padding: '10px 6px',
                            borderRadius: 8,
                            background: isSel ? 'var(--color-gold)' : d.hasSlots ? 'var(--bg-dark)' : 'rgba(255,255,255,0.02)',
                            color: isSel ? '#000' : d.hasSlots ? 'var(--fg-main)' : 'var(--fg-muted)',
                            border: isSel ? '1px solid var(--color-gold)' : '1px solid var(--border-dark)',
                            cursor: d.hasSlots ? 'pointer' : 'not-allowed',
                            opacity: d.hasSlots ? 1 : 0.4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 10 }}>{dayLabels[dt.getDay()]}</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>
                            {dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Choose Time */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 8 }}>Время:</label>
                {slotsLoading ? (
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>Загрузка времени...</div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ color: 'var(--fg-muted)', fontSize: 13 }}>На выбранную дату нет свободных слотов</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: 8 }}>
                    {availableSlots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedTime(s)}
                        style={{
                          padding: '10px 0',
                          borderRadius: 6,
                          background: selectedTime === s ? 'var(--color-gold)' : 'var(--bg-dark)',
                          color: selectedTime === s ? '#000' : 'var(--fg-main)',
                          border: selectedTime === s ? '1px solid var(--color-gold)' : '1px solid var(--border-dark)',
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={actionLoading || !selectedDate || !selectedTime}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 8,
                    background: 'var(--color-gold)',
                    color: '#050505',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    opacity: (actionLoading || !selectedDate || !selectedTime) ? 0.5 : 1,
                  }}
                >
                  {actionLoading ? 'Перенос...' : 'Подтвердить перенос'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
