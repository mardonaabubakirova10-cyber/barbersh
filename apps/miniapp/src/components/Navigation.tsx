import React from 'react';
import { CalendarCheck, CalendarDays, Sparkles, Scissors } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  bookingCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, bookingCount = 0 }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${currentTab === 'booking' ? 'active' : ''}`}
        onClick={() => onTabChange('booking')}
      >
        <CalendarCheck size={22} />
        <span>Запись</span>
      </button>

      <button
        className={`nav-item ${currentTab === 'my-bookings' ? 'active' : ''}`}
        onClick={() => onTabChange('my-bookings')}
        style={{ position: 'relative' }}
      >
        <CalendarDays size={22} />
        <span>Мои записи</span>
        {bookingCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: 'calc(50% - 18px)',
            background: 'var(--accent-gold)',
            color: '#000',
            fontSize: '9px',
            fontWeight: 800,
            borderRadius: '10px',
            padding: '1px 5px',
            minWidth: '16px',
            textAlign: 'center'
          }}>
            {bookingCount}
          </span>
        )}
      </button>

      <button
        className={`nav-item ${currentTab === 'catalog' ? 'active' : ''}`}
        onClick={() => onTabChange('catalog')}
      >
        <Scissors size={22} />
        <span>Мастера & Инфо</span>
      </button>
    </nav>
  );
};
