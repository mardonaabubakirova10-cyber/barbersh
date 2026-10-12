import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, User, Scissors, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Service, Barber } from '../types';
import { createBooking } from '../lib/api';

interface ConfirmationStepProps {
  services: Service[];
  barbers: Barber[];
  selectedServiceIds: string[];
  selectedBarberId: string;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  comment: string;
  telegramId?: string;
  onBack: () => void;
  onSuccess: (booking: any) => void;
  onSlotTakenError: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  services,
  barbers,
  selectedServiceIds,
  selectedBarberId,
  selectedDate,
  selectedTime,
  clientName,
  clientPhone,
  comment,
  telegramId,
  onBack,
  onSuccess,
  onSlotTakenError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSlotTaken, setIsSlotTaken] = useState(false);

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);
  const barberName = selectedBarber ? selectedBarber.name : 'Любой свободный мастер';

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  // Format Russian Date
  const formatDateRu = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsSlotTaken(false);

    try {
      const res = await createBooking({
        serviceIds: selectedServiceIds,
        barberId: selectedBarberId,
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        comment: comment.trim() || undefined,
        telegramId,
        source: 'TELEGRAM',
      });

      onSuccess(res);
    } catch (err: any) {
      if (err.code === 'SLOT_TAKEN' || err.message?.includes('занят') || err.message?.includes('SLOT_TAKEN')) {
        setIsSlotTaken(true);
        setErrorMessage('К сожалению, этот слот только что занял другой клиент. Пожалуйста, выберите другое время.');
      } else {
        setErrorMessage(err.message || 'Произошла ошибка при создании записи');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <CheckCircle2 size={20} color="var(--accent-gold)" />
            Подтверждение записи
          </h2>
          <p className="section-subtitle">Проверьте данные вашего визита</p>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#ef4444',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 600 }}>{errorMessage}</span>
          </div>
          {isSlotTaken && (
            <button
              onClick={onSlotTakenError}
              className="btn-secondary"
              style={{
                padding: '8px 12px',
                fontSize: '0.8rem',
                borderColor: '#ef4444',
                color: '#fff',
                marginTop: '4px'
              }}
            >
              ← Вернуться и выбрать другой слот
            </button>
          )}
        </div>
      )}

      {/* Summary Details */}
      <div className="summary-box">
        <div className="summary-row">
          <span className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} /> Дата и время:
          </span>
          <span className="summary-val" style={{ textTransform: 'capitalize' }}>
            {formatDateRu(selectedDate)}, {selectedTime}
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={15} /> Мастер:
          </span>
          <span className="summary-val" style={{ color: 'var(--accent-gold)' }}>{barberName}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} /> Длительность:
          </span>
          <span className="summary-val">{totalDuration} мин</span>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

        <div>
          <div className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Scissors size={15} /> Услуги:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {selectedServices.map((s) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#fff' }}>• {s.name}</span>
                <span style={{ color: 'var(--tg-theme-hint-color)', fontFamily: 'var(--font-mono)' }}>
                  {s.price.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

        <div className="summary-row">
          <span className="summary-label">Клиент:</span>
          <span className="summary-val">{clientName} ({clientPhone})</span>
        </div>

        {comment && (
          <div className="summary-row">
            <span className="summary-label">Комментарий:</span>
            <span className="summary-val" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>{comment}</span>
          </div>
        )}

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '4px 0' }} />

        <div className="summary-row" style={{ fontSize: '1.1rem' }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>Итого к оплате:</span>
          <span style={{ fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
            {totalPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <button
          className="btn-primary"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Бронируем слот...
            </>
          ) : (
            'Подтвердить запись ✂️'
          )}
        </button>
      </div>
    </div>
  );
};
