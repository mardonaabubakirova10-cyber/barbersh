'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Send, Star, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface PortfolioItem {
  id: string;
  imageUrl: string;
}

interface BarberItem {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  telegramChatId?: string | null;
  isActive: boolean;
}

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<BarberItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Portfolio modal state
  const [portfolioModalBarber, setPortfolioModalBarber] = useState<BarberItem | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const [form, setForm] = useState({
    name: '',
    role: 'Барбер',
    bio: '',
    photoUrl: '',
    experienceYears: 3,
    sortOrder: 0,
  });

  const loadBarbers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/barbers');
      const json = await res.json();
      if (json.success) setBarbers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarbers();
  }, []);

  const handleOpenAdd = () => {
    setEditingBarber(null);
    setForm({
      name: '',
      role: 'Барбер',
      bio: '',
      photoUrl: '',
      experienceYears: 3,
      sortOrder: barbers.length + 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: BarberItem) => {
    setEditingBarber(b);
    setForm({
      name: b.name,
      role: b.role,
      bio: b.bio || '',
      photoUrl: b.photoUrl || '',
      experienceYears: b.experienceYears,
      sortOrder: 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBarber) {
        await adminFetch(`/api/v1/admin/barbers/${editingBarber.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/api/v1/admin/barbers', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      loadBarbers();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения мастера');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Деактивировать этого мастера?')) return;
    try {
      await adminFetch(`/api/v1/admin/barbers/${id}`, { method: 'DELETE' });
      loadBarbers();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleOpenPortfolio = async (barber: BarberItem) => {
    setPortfolioModalBarber(barber);
    setLoadingPortfolio(true);
    try {
      const res = await fetch(`/api/v1/barbers/${barber.id}/portfolio`);
      const json = await res.json();
      if (json.success) setPortfolioItems(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioModalBarber || !newPhotoUrl.trim()) return;
    try {
      const res = await adminFetch<PortfolioItem>(`/api/v1/admin/barbers/${portfolioModalBarber.id}/portfolio`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl: newPhotoUrl.trim() }),
      });
      setPortfolioItems([...portfolioItems, res]);
      setNewPhotoUrl('');
    } catch (err) {
      alert('Ошибка при добавлении фото');
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    try {
      await adminFetch(`/api/v1/admin/portfolio/${id}`, { method: 'DELETE' });
      setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
    } catch (err) {
      alert('Ошибка при удалении фото');
    }
  };

  const handleCopyLink = (barberId: string) => {
    // Direct link to telegram bot start with payload
    const link = `https://t.me/blade_co_barber_bot?start=barber_link_${barberId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(barberId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Мастера и команда</h1>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Управление персоналом, фото профиля и привязка Telegram для уведомлений
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37, #b8860b)',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem'
          }}
        >
          <Plus size={16} />
          Добавить мастера
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
          <div>Загрузка мастеров...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {barbers.map((b) => (
            <div
              key={b.id}
              style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <img
                  src={b.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                  alt={b.name}
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212, 175, 55, 0.3)' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{b.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 600 }}>{b.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                    <Star size={12} fill="#d4af37" color="#d4af37" />
                    <span>{b.rating} ({b.reviewsCount} отзывов) • Опыт {b.experienceYears} лет</span>
                  </div>
                </div>
              </div>

              {b.bio && (
                <p style={{ fontSize: '0.82rem', color: '#9ca3af', lineClamp: 2 }}>
                  {b.bio}
                </p>
              )}

              {/* Telegram Binding Info */}
              <div style={{
                background: '#090a0d',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                  <Send size={14} color="#3b82f6" />
                  <span style={{ color: '#9ca3af' }}>Telegram:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>
                    {b.telegramChatId ? 'Привязан ✅' : 'Не привязан'}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyLink(b.id)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedId === b.id ? <Check size={12} /> : <Copy size={12} />}
                  {copiedId === b.id ? 'Скопировано!' : 'Ссылка для бота'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleOpenPortfolio(b)}
                  style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', padding: '6px 12px', color: '#d4af37', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <ImageIcon size={14} /> Портфолио
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEdit(b)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  >
                    <Edit2 size={13} /> Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#171a21',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                {editingBarber ? 'Редактировать мастера' : 'Новый мастер'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Имя и фамилия *</label>
                <input
                  type="text"
                  required
                  placeholder="Алексей Громов"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Должность *</label>
                  <input
                    type="text"
                    required
                    placeholder="Top Barber"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Опыт (лет) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>URL фотографии</label>
                <input
                  type="text"
                  placeholder="https://... или /barber_alexey.jpg"
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>О мастере / Биография</label>
                <textarea
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portfolio Gallery Modal */}
      {portfolioModalBarber && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#171a21',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Портфолио: {portfolioModalBarber.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                  Фотографии работ, стрижек и моделирования бороды
                </p>
              </div>
              <button
                onClick={() => setPortfolioModalBarber(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Add Photo Form */}
            <form onSubmit={handleAddPortfolioItem} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                placeholder="URL фотографии (https://...)"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#090a0d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                  color: '#000',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                + Добавить
              </button>
            </form>

            {/* Photos Grid */}
            {loadingPortfolio ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                <div>Загрузка фото...</div>
              </div>
            ) : portfolioItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7280', fontSize: '0.85rem' }}>
                В портфолио мастера пока нет фотографий
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      height: '120px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt="Work"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => handleDeletePortfolioItem(item.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.75)',
                        border: 'none',
                        color: '#ef4444',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Удалить фото"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
