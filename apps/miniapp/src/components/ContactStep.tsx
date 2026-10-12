import React from 'react';
import { User, Phone, MessageSquare, ArrowLeft, ShieldCheck } from 'lucide-react';

interface ContactStepProps {
  clientName: string;
  clientPhone: string;
  comment: string;
  onChangeName: (val: string) => void;
  onChangePhone: (val: string) => void;
  onChangeComment: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ContactStep: React.FC<ContactStepProps> = ({
  clientName,
  clientPhone,
  comment,
  onChangeName,
  onChangePhone,
  onChangeComment,
  onBack,
  onNext,
}) => {
  const digits = clientPhone.replace(/\D/g, '');
  const isPhoneValid = digits.length >= 7;
  const isNameValid = clientName.trim().length >= 2;
  const canProceed = isNameValid && isPhoneValid;

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
            <User size={20} color="var(--accent-gold)" />
            Контактные данные
          </h2>
          <p className="section-subtitle">Для подтверждения записи и SMS/TG уведомлений</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} />
            Ваше имя *
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Иван"
            value={clientName}
            onChange={(e) => onChangeName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={14} />
            Номер телефона *
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="+998 90 123-45-67 или 969696396"
            value={clientPhone}
            onChange={(e) => onChangePhone(e.target.value)}
          />
          {clientPhone.length > 0 && !isPhoneValid && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px' }}>
              Номер должен содержать минимум 7 цифр
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={14} />
            Пожелания или комментарий (необязательно)
          </label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="Например: хочу переход с нуля, чай без сахара"
            value={comment}
            onChange={(e) => onChangeComment(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        color: 'var(--tg-theme-hint-color)',
        padding: '0 4px'
      }}>
        <ShieldCheck size={16} color="var(--color-success)" />
        <span>Мы не передаем ваши данные третьим лицам</span>
      </div>

      <div style={{ marginTop: '6px' }}>
        <button
          className="btn-primary"
          disabled={!canProceed}
          onClick={onNext}
        >
          Перейти к проверке →
        </button>
      </div>
    </div>
  );
};
