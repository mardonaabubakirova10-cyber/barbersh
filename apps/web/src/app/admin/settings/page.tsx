'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    shop_name: 'BLADE & CO.',
    phone: '+7 (495) 777-24-24',
    address: 'г. Москва, ул. Большая Никитская, 24/1',
    working_hours_str: 'Ежедневно: 10:00 – 22:00',
    slot_step_minutes: '30',
    booking_window_days: '14',
    min_notice_min: '60',
    currency: 'RUB',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const data = await adminFetch<Record<string, string>>('/api/v1/admin/settings');
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Настройки барбершопа</h1>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Параметры бронирования, контакты и правила работы салона
        </p>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>Настройки успешно сохранены!</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
          <div>Загрузка настроек...</div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ background: '#12141a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Название салона</label>
            <input
              type="text"
              value={settings.shop_name || ''}
              onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Телефон</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Часы работы</label>
              <input
                type="text"
                value={settings.working_hours_str || ''}
                onChange={(e) => setSettings({ ...settings, working_hours_str: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Адрес</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Горизонт записи (дней)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={settings.booking_window_days || '14'}
                onChange={(e) => setSettings({ ...settings, booking_window_days: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>Минимальное время до записи (мин)</label>
              <input
                type="number"
                min={0}
                step={15}
                value={settings.min_notice_min || '60'}
                onChange={(e) => setSettings({ ...settings, min_notice_min: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '10px',
              alignSelf: 'flex-start',
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Сохранить настройки
          </button>
        </form>
      )}
    </div>
  );
}
