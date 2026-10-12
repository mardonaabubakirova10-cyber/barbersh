import React from 'react';
import { Check, Calendar, Clock, MapPin, Sparkles, Share2 } from 'lucide-react';
import { Booking } from '../types';

interface SuccessStepProps {
  booking: Booking;
  onGoToMyBookings: () => void;
  onNewBooking: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  booking,
  onGoToMyBookings,
  onNewBooking,
}) => {
  const startsAtDate = new Date(booking.startsAt);
  const timeStr = startsAtDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const dateStr = startsAtDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
        marginTop: '10px'
      }}>
        <Check size={36} strokeWidth={3} />
      </div>

      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Вы успешно записаны!
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
          Ждем вас в барбершопе Blade & Co.
        </p>
      </div>

      {/* Ticket Card */}
      <div className="card" style={{
        width: '100%',
        textAlign: 'left',
        background: 'linear-gradient(180deg, rgba(26, 30, 39, 0.95), rgba(15, 17, 21, 0.95))',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-confirmed">Подтверждено</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--tg-theme-hint-color)', fontFamily: 'var(--font-mono)' }}>
            #{booking.manageToken.slice(-6).toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
            {dateStr}, {timeStr}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
            Мастер: {booking.barber.name} ({booking.barber.role})
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--tg-theme-hint-color)', marginBottom: '4px' }}>
            Услуги ({booking.totalDurationMin} мин):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {booking.services.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#fff' }}>{s.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tg-theme-hint-color)' }}>
                  {s.price} ₽
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--tg-theme-hint-color)' }}>
          <MapPin size={15} color="var(--accent-gold)" />
          <span>ул. Большая Никитская, 24/1, Москва</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
        <button className="btn-primary" onClick={onGoToMyBookings}>
          Перейти в «Мои записи» 📅
        </button>

        <button className="btn-secondary" onClick={onNewBooking}>
          Сделать еще запись
        </button>
      </div>
    </div>
  );
};
