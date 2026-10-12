import React, { useState } from 'react';
import { Scissors, Star, MapPin, Phone, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Service, Barber } from '../types';

interface CatalogTabProps {
  services: Service[];
  barbers: Barber[];
  onBookWithBarber: (barberId: string) => void;
  onBookWithService: (serviceId: string) => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  services,
  barbers,
  onBookWithBarber,
  onBookWithService,
}) => {
  const [activeSection, setActiveSection] = useState<'barbers' | 'services' | 'contacts'>('barbers');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 className="section-title">
          <Scissors size={20} color="var(--accent-gold)" />
          Барбершоп Blade & Co.
        </h2>
        <p className="section-subtitle">Мастера премиум-класса и фирменный сервис</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--tg-theme-secondary-bg-color)',
        borderRadius: '12px',
        padding: '3px',
        border: '1px solid var(--card-border)'
      }}>
        <button
          onClick={() => setActiveSection('barbers')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '9px',
            border: 'none',
            background: activeSection === 'barbers' ? 'var(--card-bg)' : 'transparent',
            color: activeSection === 'barbers' ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Мастера ({barbers.length})
        </button>
        <button
          onClick={() => setActiveSection('services')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '9px',
            border: 'none',
            background: activeSection === 'services' ? 'var(--card-bg)' : 'transparent',
            color: activeSection === 'services' ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Прайс-лист ({services.length})
        </button>
        <button
          onClick={() => setActiveSection('contacts')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '9px',
            border: 'none',
            background: activeSection === 'contacts' ? 'var(--card-bg)' : 'transparent',
            color: activeSection === 'contacts' ? 'var(--accent-gold)' : 'var(--tg-theme-hint-color)',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Контакты
        </button>
      </div>

      {/* Section: Barbers */}
      {activeSection === 'barbers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {barbers.map((b) => (
            <div key={b.id} className="card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                <img
                  src={b.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                  alt={b.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div className="barber-rating-badge" style={{ bottom: '-2px', right: '-2px' }}>
                  <Star size={9} fill="var(--accent-gold)" />
                  <span>{b.rating}</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{b.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{b.role}</div>
                {b.bio && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)', marginTop: '2px', lineClamp: 2 }}>
                    {b.bio}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                  Опыт: {b.experienceYears} {b.experienceYears === 1 ? 'год' : 'лет'} • {b.reviewsCount} отзывов
                </div>
              </div>

              <button
                className="btn-secondary"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '0.78rem', borderColor: 'var(--accent-gold)' }}
                onClick={() => onBookWithBarber(b.id)}
              >
                Запись
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Section: Services */}
      {activeSection === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {services.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{s.name}</div>
                {s.description && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                    {s.description}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>
                  {s.durationMin} мин • {s.category}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                  {s.price.toLocaleString('ru-RU')} ₽
                </div>
                <button
                  className="btn-secondary"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => onBookWithService(s.id)}
                >
                  Выбрать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section: Contacts */}
      {activeSection === 'contacts' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <MapPin size={18} color="var(--accent-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>Адрес</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--tg-theme-hint-color)' }}>
                г. Москва, ул. Большая Никитская, 24/1
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--tg-theme-hint-color)', marginTop: '2px' }}>
                м. Арбатская, Охотный Ряд (5 мин пешком)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Clock size={18} color="var(--accent-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>Режим работы</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--tg-theme-hint-color)' }}>
                Ежедневно с 10:00 до 22:00
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>
                Сейчас открыто
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Phone size={18} color="var(--accent-gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>Телефон для связи</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                +7 (495) 777-24-24
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="tel:+74957772424"
              className="btn-secondary"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <Phone size={16} /> Позвонить
            </a>
            <a
              href="https://yandex.ru/maps"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <MapPin size={16} /> Карта
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
