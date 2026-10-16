'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Phone,
  Scissors,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface BookingItem {
  id: string;
  manageToken: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  totalDurationMin: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  source: 'WEB' | 'TELEGRAM' | 'ADMIN';
  barber: { id: string; name: string; role: string };
  client: { id: string; name: string; phone: string };
  services: Array<{ id: string; name: string; price: number; durationMin: number }>;
}

interface BarberItem {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientPhone: '',
    barberId: '',
    serviceIds: [] as string[],
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    comment: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedDate) query.set('date', selectedDate);
      if (selectedBarberId !== 'all') query.set('barberId', selectedBarberId);
      if (selectedStatus !== 'all') query.set('status', selectedStatus);
      if (searchQuery.trim()) query.set('search', searchQuery.trim());

      const [bData, barbersRes, servicesRes] = await Promise.all([
        adminFetch<BookingItem[]>(`/api/v1/admin/bookings?${query.toString()}`),
        fetch('/api/v1/barbers').then((r) => r.json()),
        fetch('/api/v1/services').then((r) => r.json()),
      ]);

      setBookings(bData);
      if (barbersRes.success) setBarbers(barbersRes.data);
      if (servicesRes.success) setServices(servicesRes.data);
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedBarberId, selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await adminFetch(`/api/v1/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus as any } : b))
      );
    } catch (err) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await adminFetch(`/api/v1/admin/bookings/${id}`, { method: 'DELETE' });
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.barberId || newBooking.serviceIds.length === 0) {
      alert('Выберите мастера и хотя бы одну услугу');
      return;
    }

    setCreateSubmitting(true);
    try {
      await adminFetch('/api/v1/admin/bookings', {
        method: 'POST',
        body: JSON.stringify(newBooking),
      });
      setShowCreateModal(false);
      setNewBooking({
        clientName: '',
        clientPhone: '',
        barberId: '',
        serviceIds: [],
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        comment: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка создания записи');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const revenueSum = bookings
    .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Управление записями</h1>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
            Просмотр, создание и модерация визитов клиентов
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => loadData()}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#171a21',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={15} />
            Обновить
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#000',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)'
            }}
          >
            <Plus size={16} />
            Создать запись
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>ВСЕГО ЗАПИСЕЙ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{totalCount}</div>
        </div>
        <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>ПОДТВЕРЖДЕНЫ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{confirmedCount}</div>
        </div>
        <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>ЗАВЕРШЕНЫ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>{completedCount}</div>
        </div>
        <div style={{ background: '#12141a', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: '#d4af37', fontWeight: 600 }}>ОБЪЕМ ВЫРУЧКИ</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d4af37', marginTop: '4px' }}>
            {revenueSum.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: '#090a0d', borderRadius: '10px', padding: '0 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Поиск по имени, тел, токену..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Date Filter */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            background: '#090a0d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '9px 12px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />

        {/* Barber Filter */}
        <select
          value={selectedBarberId}
          onChange={(e) => setSelectedBarberId(e.target.value)}
          style={{
            background: '#090a0d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '9px 12px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="all">Все мастера</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            background: '#090a0d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '9px 12px',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="all">Все статусы</option>
          <option value="CONFIRMED">Подтверждена</option>
          <option value="COMPLETED">Завершена</option>
          <option value="CANCELLED">Отменена</option>
          <option value="NO_SHOW">Неявка</option>
        </select>

        {(selectedDate || selectedBarberId !== 'all' || selectedStatus !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedDate('');
              setSelectedBarberId('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div style={{
        background: '#12141a',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        overflowX: 'auto',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
            <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
            <div>Загрузка списка записей...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af' }}>
            <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <div>Записи не найдены</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>Дата & Время</th>
                <th style={{ padding: '14px 16px' }}>Клиент</th>
                <th style={{ padding: '14px 16px' }}>Мастер</th>
                <th style={{ padding: '14px 16px' }}>Услуги</th>
                <th style={{ padding: '14px 16px' }}>Стоимость</th>
                <th style={{ padding: '14px 16px' }}>Источник</th>
                <th style={{ padding: '14px 16px' }}>Статус</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const startsAt = new Date(b.startsAt);
                const timeStr = startsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                const dateStr = startsAt.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC'
                });

                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{timeStr}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{dateStr}</div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{b.client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{b.client.phone}</div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#d4af37', fontWeight: 600 }}>{b.barber.name}</div>
                    </td>

                    <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                      <div style={{ color: '#fff', fontSize: '0.82rem' }}>
                        {b.services.map((s) => s.name).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                        {b.totalDurationMin} мин
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                      {b.totalPrice.toLocaleString('ru-RU')} ₽
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: b.source === 'TELEGRAM' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.08)',
                        color: b.source === 'TELEGRAM' ? '#3b82f6' : '#9ca3af'
                      }}>
                        {b.source}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        style={{
                          background: b.status === 'CONFIRMED'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : b.status === 'COMPLETED'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : b.status === 'CANCELLED'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                          color: b.status === 'CONFIRMED'
                            ? '#10b981'
                            : b.status === 'COMPLETED'
                            ? '#3b82f6'
                            : b.status === 'CANCELLED'
                            ? '#ef4444'
                            : '#f59e0b',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="CONFIRMED">Подтверждена</option>
                        <option value="COMPLETED">Завершена</option>
                        <option value="CANCELLED">Отменена</option>
                        <option value="NO_SHOW">Неявка</option>
                      </select>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(b.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                        title="Удалить запись"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
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
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Создать запись вручную</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Имя клиента *</label>
                  <input
                    type="text"
                    required
                    placeholder="Александр"
                    value={newBooking.clientName}
                    onChange={(e) => setNewBooking({ ...newBooking, clientName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Телефон *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (999) 000-00-00"
                    value={newBooking.clientPhone}
                    onChange={(e) => setNewBooking({ ...newBooking, clientPhone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Барбер *</label>
                <select
                  required
                  value={newBooking.barberId}
                  onChange={(e) => setNewBooking({ ...newBooking, barberId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                >
                  <option value="">Выберите мастера...</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Услуги (выберите хотя бы одну) *</label>
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', background: '#090a0d', padding: '8px', borderRadius: '8px' }}>
                  {services.map((s) => {
                    const checked = newBooking.serviceIds.includes(s.id);
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setNewBooking({
                              ...newBooking,
                              serviceIds: checked
                                ? newBooking.serviceIds.filter((id) => id !== s.id)
                                : [...newBooking.serviceIds, s.id],
                            });
                          }}
                        />
                        <span>{s.name} ({s.price} ₽, {s.durationMin} мин)</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Дата *</label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Время *</label>
                  <input
                    type="time"
                    required
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {createSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
