import React, { useEffect, useState } from 'react';
import { Calendar, Clock, X, Loader2, AlertCircle } from 'lucide-react';
import { Booking } from '../types';
import { fetchAvailability, fetchAvailableDays, rescheduleBooking } from '../lib/api';

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  booking,
  onClose,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [days, setDays] = useState<Array<{ date: string; hasSlots: boolean }>>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDays() {
      setLoadingDays(true);
      setError(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchAvailableDays({
          barberId: booking.barber.id,
          fromDate: today,
          durationMin: booking.totalDurationMin,
          days: 14,
        });
        setDays(res);
        const firstAvail = res.find((d) => d.hasSlots)?.date || res[0]?.date;
        if (firstAvail) setSelectedDate(firstAvail);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки доступных дней');
      } finally {
        setLoadingDays(false);
      }
    }
    loadDays();
  }, [booking]);

  useEffect(() => {
    if (!selectedDate) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await fetchAvailability({
          barberId: booking.barber.id,
          date: selectedDate,
          durationMin: booking.totalDurationMin,
        });
        setSlots(res.slots);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки слотов');
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [booking, selectedDate]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await rescheduleBooking(booking.manageToken, {
        date: selectedDate,
        time: selectedTime,
        barberId: booking.barber.id,
      });
      onSuccess(updated);
    } catch (err: any) {
      if (err.code === 'SLOT_TAKEN') {
        setError('Выбранный слот уже занят. Выберите другое время.');
      } else {
        setError(err.message || 'Не удалось перенести запись');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Перенос записи</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)' }}>
              Мастер: {booking.barber.name} ({booking.totalDurationMin} мин)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--tg-theme-hint-color)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tg-theme-hint-color)', marginBottom: '6px' }}>
            Новая дата
          </div>
          {loadingDays ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : (
            <div className="date-scroller">
              {days.map((item) => {
                const d = new Date(item.date + 'T00:00:00');
                const isSelected = selectedDate === item.date;
                return (
                  <div
                    key={item.date}
                    className={`date-pill ${isSelected ? 'selected' : ''} ${!item.hasSlots ? 'disabled' : ''}`}
                    onClick={() => item.hasSlots && setSelectedDate(item.date)}
                  >
                    <span className="date-day-name">{dayNames[d.getDay()]}</span>
                    <span className="date-day-num">{d.getDate()}</span>
                    <span className="date-month">{monthNames[d.getMonth()]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slots */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tg-theme-hint-color)', marginBottom: '6px' }}>
            Новое время
          </div>
          {loadingSlots ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--tg-theme-hint-color)', fontSize: '0.85rem' }}>
              Нет доступных слотов на выбранный день
            </div>
          ) : (
            <div className="slot-grid">
              {slots.map((s) => (
                <button
                  key={s}
                  className={`slot-btn ${selectedTime === s ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Отмена
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2 }}
            disabled={!selectedDate || !selectedTime || submitting}
            onClick={handleReschedule}
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Сохранить перенос'}
          </button>
        </div>
      </div>
    </div>
  );
};
