import React from 'react';
import { Scissors, User as UserIcon } from 'lucide-react';
import { TelegramUser } from '../types/telegram';

interface HeaderProps {
  user: TelegramUser | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #d4af37, #9c7b16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000'
        }}>
          <Scissors size={18} />
        </div>
        <div>
          <div className="brand-title">BLADE & CO.</div>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.05em' }}>BARBERSHOP</div>
        </div>
      </div>

      <div className="user-badge">
        <div className="user-avatar-circle">
          {user?.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span>{user?.first_name || 'Гость'}</span>
      </div>
    </header>
  );
};
