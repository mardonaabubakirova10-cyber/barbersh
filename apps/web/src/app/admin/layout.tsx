'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scissors,
  Calendar,
  Users,
  Clock,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { getAdminToken, clearAdminToken } from '@/lib/admin-api';

const navigation = [
  { name: 'Записи', href: '/admin', icon: Calendar },
  { name: 'Услуги', href: '/admin/services', icon: Scissors },
  { name: 'Барберы', href: '/admin/barbers', icon: Users },
  { name: 'График & Выходные', href: '/admin/schedule', icon: Clock },
  { name: 'Отзывы', href: '/admin/reviews', icon: Star },
  { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Настройки', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // If on login page, render children directly without sidebar
    if (pathname === '/admin/login') {
      setIsAuth(true);
      return;
    }

    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    } else {
      setIsAuth(true);
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuth) {
    return null;
  }

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin/login');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#090a0d',
      color: '#f3f4f6',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#12141a',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'none',
        transition: 'transform 0.25s ease',
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37, #9c7b16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 800
          }}>
            <Scissors size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.05em', color: '#fff' }}>
              BLADE & CO.
            </div>
            <div style={{ fontSize: '0.7rem', color: '#d4af37', letterSpacing: '0.1em' }}>
              ADMIN PANEL
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  color: isActive ? '#d4af37' : '#9ca3af',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Links & Logout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.8rem',
              color: '#9ca3af',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <span>Открыть сайт</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              width: '100%',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={16} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div style={{
        flex: 1,
        marginLeft: '260px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Top Header */}
        <header style={{
          height: '64px',
          background: '#12141a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Menu size={22} />
            </button>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
              {navigation.find((n) => n.href === pathname)?.name || 'Панель управления'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: '#10b981',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Система онлайн
            </div>

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #9c7b16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: '#000'
            }}>
              A
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
