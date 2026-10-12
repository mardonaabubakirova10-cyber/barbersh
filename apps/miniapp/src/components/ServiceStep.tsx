import React, { useState } from 'react';
import { Check, Clock, Sparkles } from 'lucide-react';
import { Service } from '../types';

interface ServiceStepProps {
  services: Service[];
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export const ServiceStep: React.FC<ServiceStepProps> = ({
  services,
  selectedServiceIds,
  onToggleService,
  onNext,
  isLoading,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) =>
    activeCategory === 'all' ? true : s.category === activeCategory
  );

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--tg-theme-hint-color)' }}>
        <div style={{ marginBottom: '12px' }}>Загрузка услуг...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 className="section-title">
          <Sparkles size={20} color="var(--accent-gold)" />
          Выберите услуги
        </h2>
        <p className="section-subtitle">Можно выбрать одну или несколько услуг</p>
      </div>

      {/* Categories chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: activeCategory === cat ? '1px solid var(--accent-gold)' : '1px solid var(--card-border)',
              background: activeCategory === cat ? 'rgba(212, 175, 55, 0.15)' : 'var(--card-bg)',
              color: activeCategory === cat ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {cat === 'all' ? 'Все услуги' : cat}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredServices.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);
          return (
            <div
              key={service.id}
              className={`card service-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleService(service.id)}
            >
              <div className="service-info">
                <div className="service-name">{service.name}</div>
                {service.description && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                    {service.description}
                  </div>
                )}
                <div className="service-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {service.durationMin} мин
                  </span>
                  <span>•</span>
                  <span>{service.category}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="service-price">{service.price.toLocaleString('ru-RU')} ₽</div>
                <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Summary & Next Button */}
      {selectedServiceIds.length > 0 && (
        <div style={{
          position: 'sticky',
          bottom: '80px',
          background: 'rgba(15, 17, 21, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '12px',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)' }}>
                Выбрано: {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'услуга' : 'услуги'} ({totalDuration} мин)
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {totalPrice.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 24px' }}
              onClick={onNext}
            >
              Далее →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
