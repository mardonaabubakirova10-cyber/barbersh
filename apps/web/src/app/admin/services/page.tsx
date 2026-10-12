'use client';

import React, { useEffect, useState } from 'react';
import { Scissors, Plus, Edit2, Trash2, Clock, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  durationMin: number;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Стрижки',
    description: '',
    price: 1500,
    durationMin: 45,
    sortOrder: 0,
    isActive: true,
  });

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/services');
      const json = await res.json();
      if (json.success) setServices(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setForm({
      name: '',
      category: 'Стрижки',
      description: '',
      price: 1500,
      durationMin: 45,
      sortOrder: services.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ServiceItem) => {
    setEditingService(s);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description || '',
      price: s.price,
      durationMin: s.durationMin,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await adminFetch(`/api/v1/admin/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/api/v1/admin/services', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения услуги');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Деактивировать эту услугу?')) return;
    try {
      await adminFetch(`/api/v1/admin/services/${id}`, { method: 'DELETE' });
      loadServices();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Услуги и прайс-лист</h1>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Добавление и редактирование стоимости и длительности процедур
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
          Добавить услугу
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
          <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
          <div>Загрузка услуг...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#12141a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      {s.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>{s.name}</h3>
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d4af37', fontFamily: 'monospace' }}>
                    {s.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                {s.description && (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '6px', lineClamp: 2 }}>
                    {s.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#9ca3af' }}>
                  <Clock size={14} />
                  <span>{s.durationMin} мин</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEdit(s)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                  >
                    <Edit2 size={13} /> Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
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
                {editingService ? 'Редактировать услугу' : 'Новая услуга'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Название услуги *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Категория *</label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Стрижки, Борода..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Длительность (мин) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={form.durationMin}
                    onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Цена (₽) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Описание</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
    </div>
  );
}
