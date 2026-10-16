'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

interface BarberItem {
  id: string;
  name: string;
}

export default function AdminSchedulePage() {
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Time off state
  const [timeOffStartsAt, setTimeOffStartsAt] = useState('');
  const [timeOffEndsAt, setTimeOffEndsAt] = useState('');
  const [timeOffType, setTimeOffType] = useState('VACATION');
  const [timeOffNote, setTimeOffNote] = useState('');

  const weekdays = [
    { id: 1, name: 'Понедельник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Среда' },
    { id: 4, name: 'Четверг' },
    { id: 5, name: 'Пятница' },
    { id: 6, name: 'Суббота' },
    { id: 0, name: 'Воскресенье' },
  ];

  const [schedule, setSchedule] = useState(
    weekdays.map((w) => ({
      weekday: w.id,
      enabled: true,
      startTime: '10:00',
      endTime: '21:00',
      breakStart: '14:00',
      breakEnd: '15:00',
    }))
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/barbers');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setBarbers(json.data);
          setSelectedBarberId(json.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSchedule = async () => {
    if (!selectedBarberId) return;
    try {
      const workingHours = schedule
        .filter((s) => s.enabled)
        .map((s) => ({
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
        }));

      const breaks = schedule
        .filter((s) => s.enabled && s.breakStart && s.breakEnd)
        .map((s) => ({
          weekday: s.weekday,
          startTime: s.breakStart,
          endTime: s.breakEnd,
        }));

      await adminFetch(`/api/v1/admin/barbers/${selectedBarberId}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ workingHours, breaks }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Ошибка при сохранении расписания');
    }
  };

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberId || !timeOffStartsAt || !timeOffEndsAt) {
      alert('Заполните даты отпуска/выходного');
      return;
    }

    try {
      await adminFetch(`/api/v1/admin/barbers/${selectedBarberId}/time-off`, {
        method: 'POST',
        body: JSON.stringify({
          startsAt: `${timeOffStartsAt}T00:00:00.000Z`,
          endsAt: `${timeOffEndsAt}T23:59:59.999Z`,
          type: timeOffType,
          note: timeOffNote,
        }),
      });

      setTimeOffStartsAt('');
      setTimeOffEndsAt('');
      setTimeOffNote('');
      alert('Период отсутствия успешно добавлен в календарь');
    } catch (err) {
      alert('Ошибка при добавлении');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>График работы и выходные</h1>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Настройка рабочих часов, обеденных перерывов и отпусков мастеров
        </p>
      </div>

      {/* Select Barber */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#12141a', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af' }}>Мастер:</span>
        <select
          value={selectedBarberId}
          onChange={(e) => setSelectedBarberId(e.target.value)}
          style={{
            background: '#090a0d',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            outline: 'none'
          }}
        >
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>График работы успешно сохранен!</span>
        </div>
      )}

      {/* Weekly Schedule Table */}
      <div style={{ background: '#12141a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Недельный график</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {weekdays.map((w, idx) => {
            const item = schedule[idx];
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: item.enabled ? '#090a0d' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ width: '130px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const next = [...schedule];
                      next[idx].enabled = e.target.checked;
                      setSchedule(next);
                    }}
                  />
                  <span style={{ fontWeight: 600, color: item.enabled ? '#fff' : '#6b7280', fontSize: '0.88rem' }}>
                    {w.name}
                  </span>
                </div>

                {item.enabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#9ca3af' }}>Рабочие часы:</span>
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => {
                          const next = [...schedule];
                          next[idx].startTime = e.target.value;
                          setSchedule(next);
                        }}
                        style={{ background: '#171a21', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem' }}
                      />
                      <span>—</span>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => {
                          const next = [...schedule];
                          next[idx].endTime = e.target.value;
                          setSchedule(next);
                        }}
                        style={{ background: '#171a21', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#9ca3af' }}>Обед:</span>
                      <input
                        type="time"
                        value={item.breakStart}
                        onChange={(e) => {
                          const next = [...schedule];
                          next[idx].breakStart = e.target.value;
                          setSchedule(next);
                        }}
                        style={{ background: '#171a21', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem' }}
                      />
                      <span>—</span>
                      <input
                        type="time"
                        value={item.breakEnd}
                        onChange={(e) => {
                          const next = [...schedule];
                          next[idx].breakEnd = e.target.value;
                          setSchedule(next);
                        }}
                        style={{ background: '#171a21', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px 6px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>Выходной день</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSaveSchedule}
          style={{
            alignSelf: 'flex-start',
            marginTop: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37, #b8860b)',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Сохранить график
        </button>
      </div>

      {/* Add Time Off (Vacation / Sick Leave) */}
      <div style={{ background: '#12141a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Отпуск / Больничный / Выходные исключения</h3>

        <form onSubmit={handleAddTimeOff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Дата начала *</label>
            <input
              type="date"
              required
              value={timeOffStartsAt}
              onChange={(e) => setTimeOffStartsAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Дата окончания *</label>
            <input
              type="date"
              required
              value={timeOffEndsAt}
              onChange={(e) => setTimeOffEndsAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Тип *</label>
            <select
              value={timeOffType}
              onChange={(e) => setTimeOffType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            >
              <option value="VACATION">Отпуск</option>
              <option value="SICK_LEAVE">Больничный</option>
              <option value="DAY_OFF">Внеплановый выходной</option>
              <option value="SALON_CLOSED">Салон закрыт</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Примечание</label>
            <input
              type="text"
              placeholder="Семейные обстоятельства..."
              value={timeOffNote}
              onChange={(e) => setTimeOffNote(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#090a0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginTop: '4px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: '#171a21',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#d4af37',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
