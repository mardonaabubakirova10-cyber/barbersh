import React from 'react';
import { UserCheck, Star, Users, ArrowLeft } from 'lucide-react';
import { Barber } from '../types';

interface BarberStepProps {
  barbers: Barber[];
  selectedBarberId: string;
  onSelectBarber: (barberId: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

export const BarberStep: React.FC<BarberStepProps> = ({
  barbers,
  selectedBarberId,
  onSelectBarber,
  onBack,
  onNext,
  isLoading,
}) => {
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
            <UserCheck size={20} color="var(--accent-gold)" />
            Выберите барбера
          </h2>
          <p className="section-subtitle">К кому вы хотите записаться?</p>
        </div>
      </div>

      {/* Option: Any Barber */}
      <div
        className={`card ${selectedBarberId === 'any' ? 'selected' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => {
          onSelectBarber('any');
        }}
      >
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
          border: '1px dashed var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-gold)'
        }}>
          <Users size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>Любой свободный мастер</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)' }}>
            Подберем ближайшее удобное для вас время
          </div>
        </div>
        <div className={`checkbox-circle ${selectedBarberId === 'any' ? 'checked' : ''}`} />
      </div>

      {/* Barbers Grid */}
      <div className="barber-grid">
        {barbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          return (
            <div
              key={barber.id}
              className={`card barber-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectBarber(barber.id)}
            >
              <div className="barber-avatar-wrap">
                <img
                  src={barber.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                  alt={barber.name}
                  className="barber-avatar"
                />
                <div className="barber-rating-badge">
                  <Star size={10} fill="var(--accent-gold)" />
                  <span>{barber.rating}</span>
                </div>
              </div>

              <div className="barber-name">{barber.name}</div>
              <div className="barber-role">{barber.role}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                Опыт: {barber.experienceYears} {barber.experienceYears === 1 ? 'год' : 'лет'}
              </div>
            </div>
          );
        })}
      </div>

      {selectedBarberId && (
        <div style={{ marginTop: '10px' }}>
          <button className="btn-primary" onClick={onNext}>
            Выбрать дату и время →
          </button>
        </div>
      )}
    </div>
  );
};
