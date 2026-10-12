import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { fetchAvailability, fetchAvailableDays } from '../lib/api';

interface DateTimeStepProps {
  barberId: string;
  durationMin: number;
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const DateTimeStep: React.FC<DateTimeStepProps> = ({
  barberId,
  durationMin,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onBack,
  onNext,
}) => {
  const [days, setDays] = useState<Array<{ date: string; hasSlots: boolean }>>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingDays, setLoadingDays] = useState<boolean>(true);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load available 14 days
  useEffect(() => {
    async function loadDays() {
      setLoadingDays(true);
      setError(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetchAvailableDays({
          barberId,
          fromDate: today,
          durationMin,
          days: 14,
        });
        setDays(res);

        // Auto select first date if not selected or current selection is invalid
        const firstAvailable = res.find((d) => d.hasSlots)?.date || res[0]?.date;
        if (!selectedDate && firstAvailable) {
          onSelectDate(firstAvailable);
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки расписания');
      } finally {
        setLoadingDays(false);
      }
    }
    loadDays();
  }, [barberId, durationMin]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await fetchAvailability({
          barberId,
          date: selectedDate,
          durationMin,
        });
        setSlots(res.slots);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки слотов');
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [barberId, selectedDate, durationMin]);

  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--tg-theme-hint-color)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="section-title">
            <Calendar size={20} color="var(--accent-gold)" />
            Дата и время
          </h2>
          <p className="section-subtitle">Выберите подходящее свободное окно</p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Date Scroller */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tg-theme-hint-color)', marginBottom: '8px' }}>
          Выберите день
        </div>

        {loadingDays ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '72px', color: 'var(--tg-theme-hint-color)' }}>
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : (
          <div className="date-scroller">
            {days.map((item) => {
              const d = new Date(item.date + 'T00:00:00');
              const isSelected = selectedDate === item.date;
              const dayName = dayNames[d.getDay()];
              const dayNum = d.getDate();
              const monthName = monthNames[d.getMonth()];

              return (
                <div
                  key={item.date}
                  className={`date-pill ${isSelected ? 'selected' : ''} ${!item.hasSlots ? 'disabled' : ''}`}
                  onClick={() => item.hasSlots && onSelectDate(item.date)}
                >
                  <span className="date-day-name">{dayName}</span>
                  <span className="date-day-num">{dayNum}</span>
                  <span className="date-month">{monthName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slot Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tg-theme-hint-color)' }}>
            Свободное время
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
            Длительность: {durationMin} мин
          </div>
        </div>

        {loadingSlots ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0', color: 'var(--tg-theme-hint-color)' }}>
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : slots.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--tg-theme-hint-color)' }}>
            <Clock size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div>На этот день свободных окон не найдено</div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Попробуйте выбрать другую дату или мастера</div>
          </div>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  className={`slot-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectTime(slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTime && (
        <div style={{ marginTop: '10px' }}>
          <button className="btn-primary" onClick={onNext}>
            Подтвердить слот ({selectedTime}) →
          </button>
        </div>
      )}
    </div>
  );
};
