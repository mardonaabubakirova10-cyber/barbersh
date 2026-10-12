import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Scissors, XCircle, RotateCcw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Booking } from '../types';
import { fetchTelegramBookings, cancelBooking } from '../lib/api';
import { RescheduleModal } from './RescheduleModal';

interface MyBookingsTabProps {
  telegramId?: string;
  userPhone?: string;
  onNewBookingClick: () => void;
  onShowAlert: (msg: string) => void;
  onShowConfirm: (msg: string) => Promise<boolean>;
}

export const MyBookingsTab: React.FC<MyBookingsTabProps> = ({
  telegramId,
  userPhone,
  onNewBookingClick,
  onShowAlert,
  onShowConfirm,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'past'>('upcoming');
  const [phoneSearch, setPhoneSearch] = useState<string>(userPhone || '');

  const loadBookings = async (phoneToQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTelegramBookings({
        telegramId,
        phone: phoneToQuery || phoneSearch || undefined,
      });
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [telegramId]);

  const handleCancel = async (booking: Booking) => {
    const confirmed = await onShowConfirm(
      `Вы уверены, что хотите отменить запись к мастеру ${booking.barber.name}?`
    );
    if (!confirmed) return;

    try {
      const updated = await cancelBooking(booking.manageToken);
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, status: 'CANCELLED' } : b))
      );
      onShowAlert('Запись успешно отменена');
    } catch (err: any) {
      onShowAlert(err.message || 'Ошибка при отмене записи');
    }
  };

  const handleRescheduleSuccess = (updated: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    setReschedulingBooking(null);
    onShowAlert('Запись успешно перенесена!');
  };

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const d = new Date(b.startsAt);
    return d >= now && b.status !== 'CANCELLED';
  });

  const pastBookings = bookings.filter((b) => {
    const d = new Date(b.startsAt);
    return d < now || b.status === 'CANCELLED';
  });

  const currentList = activeSubTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 className="section-title">
          <Calendar size={20} color="var(--accent-gold)" />
          Мои записи
        </h2>
        <p className="section-subtitle">Управление текущими и прошедшими визитами</p>
      </div>

      {/* Sub-tabs: Предстоящие vs Прошедшие */}
      <div style={{
        display: 'flex',
        background: 'var(--tg-theme-secondary-bg-color)',
        borderRadius: '12px',
        padding: '3px',
        border: '1px solid var(--card-border)'
      }}>
        <button
          onClick={() => setActiveSubTab('upcoming')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '9px',
            border: 'none',
            background: activeSubTab === 'upcoming' ? 'var(--card-bg)' : 'transparent',
            color: activeSubTab === 'upcoming' ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Предстоящие ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab('past')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '9px',
            border: 'none',
            background: activeSubTab === 'past' ? 'var(--card-bg)' : 'transparent',
            color: activeSubTab === 'past' ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          История ({pastBookings.length})
        </button>
      </div>

      {/* Phone search input for linked bookings */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="tel"
          className="input-field"
          placeholder="Поиск по телефону (+7...)"
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
        />
        <button
          className="btn-secondary"
          onClick={() => loadBookings(phoneSearch)}
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Найти
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--tg-theme-hint-color)' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          <div>Загрузка записей...</div>
        </div>
      ) : error ? (
        <div className="card" style={{ color: '#ef4444', textAlign: 'center', padding: '24px' }}>
          <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
          <div>{error}</div>
          <button className="btn-secondary" onClick={() => loadBookings()} style={{ marginTop: '12px' }}>
            Попробовать снова
          </button>
        </div>
      ) : currentList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--tg-theme-hint-color)' }}>
          <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
            {activeSubTab === 'upcoming' ? 'Нет активных записей' : 'История пуста'}
          </div>
          <p style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
            {activeSubTab === 'upcoming'
              ? 'Запишитесь на удобное время прямо сейчас'
              : 'Здесь будут отображаться ваши завершенные или отмененные записи'}
          </p>
          {activeSubTab === 'upcoming' && (
            <button className="btn-primary" onClick={onNewBookingClick} style={{ width: 'auto', margin: '0 auto' }}>
              Записаться к барберу ✂️
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentList.map((booking) => {
            const startsAt = new Date(booking.startsAt);
            const timeStr = startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
            const dateStr = startsAt.toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
              timeZone: 'UTC',
            });

            const isUpcoming = activeSubTab === 'upcoming' && booking.status === 'CONFIRMED';

            return (
              <div key={booking.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={`badge ${
                      booking.status === 'CONFIRMED'
                        ? 'badge-confirmed'
                        : booking.status === 'CANCELLED'
                        ? 'badge-cancelled'
                        : 'badge-completed'
                    }`}>
                      {booking.status === 'CONFIRMED'
                        ? 'Подтверждена'
                        : booking.status === 'CANCELLED'
                        ? 'Отменена'
                        : 'Завершена'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--tg-theme-hint-color)' }}>
                    #{booking.manageToken.slice(-6).toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
                      {dateStr} в {timeStr}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
                      Мастер: {booking.barber.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
                      {booking.totalPrice.toLocaleString('ru-RU')} ₽
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--tg-theme-hint-color)' }}>
                      {booking.totalDurationMin} мин
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--tg-theme-hint-color)' }}>
                  {booking.services.map((s) => s.name).join(', ')}
                </div>

                {isUpcoming && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                      onClick={() => setReschedulingBooking(booking)}
                    >
                      <RotateCcw size={14} />
                      Перенести
                    </button>
                    <button
                      className="btn-secondary btn-danger"
                      style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                      onClick={() => handleCancel(booking)}
                    >
                      <XCircle size={14} />
                      Отменить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
};
