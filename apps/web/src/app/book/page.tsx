'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  category: string;
  isActive: boolean;
}

interface BarberData {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
}

// ─── Inner Component (needs Suspense because of useSearchParams) ──────────────
function BookingInner() {
  const searchParams = useSearchParams();

  // Wizard steps: 1 = Service, 2 = Barber, 3 = Date & Time, 4 = Contact, 5 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data from API
  const [services, setServices] = useState<ServiceData[]>([]);
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<{ date: string; hasSlots: boolean }[]>([]);

  // Loading / error states
  const [servicesLoading, setServicesLoading] = useState(true);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [daysLoading, setDaysLoading] = useState(false);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Все');

  // Contact form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientComment, setClientComment] = useState('');

  // Submission
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // ─── Derived ────────────────────────────────────────────────────────────────
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedBarber = selectedBarberId === 'any'
    ? { id: 'any', name: 'Любой свободный мастер', role: 'Автоматический подбор', photoUrl: null }
    : barbers.find(b => b.id === selectedBarberId);

  const categories = ['Все', ...Array.from(new Set(services.map(s => s.category)))];
  const filteredServices = activeCategory === 'Все'
    ? services
    : services.filter(s => s.category === activeCategory);

  // ─── Initial data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/v1/services')
      .then(r => r.json())
      .then(j => { if (j.success) setServices(j.data); })
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/v1/barbers')
      .then(r => r.json())
      .then(j => { if (j.success) setBarbers(j.data); })
      .finally(() => setBarbersLoading(false));
  }, []);

  // Pre-select service/barber from URL params (e.g. ?serviceId=srv-1)
  useEffect(() => {
    const sid = searchParams.get('serviceId');
    const bid = searchParams.get('barberId');
    if (sid) setSelectedServiceId(sid);
    if (bid) setSelectedBarberId(bid);
  }, [searchParams]);

  // ─── Available days fetch (when step 3 opens) ────────────────────────────────
  useEffect(() => {
    if (currentStep !== 3 || !selectedService) return;

    const today = new Date().toISOString().split('T')[0];
    setDaysLoading(true);
    setAvailableDays([]);

    fetch(`/api/v1/availability/days?barberId=${selectedBarberId}&fromDate=${today}&durationMin=${selectedService.durationMin}&days=14`)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setAvailableDays(j.data);
          // Auto-select first available day
          const first = j.data.find((d: { date: string; hasSlots: boolean }) => d.hasSlots);
          if (first) setSelectedDate(first.date);
        }
      })
      .finally(() => setDaysLoading(false));
  }, [currentStep, selectedBarberId, selectedService?.durationMin]);

  // ─── Slots fetch (when date changes on step 3) ──────────────────────────────
  const fetchSlots = useCallback(() => {
    if (!selectedDate || !selectedService) return;

    setSlotsLoading(true);
    setAvailableSlots([]);
    setSelectedTime('');

    fetch(`/api/v1/availability?barberId=${selectedBarberId}&date=${selectedDate}&durationMin=${selectedService.durationMin}`)
      .then(r => r.json())
      .then(j => { if (j.success) setAvailableSlots(j.data.slots); })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedBarberId, selectedService?.durationMin]);

  useEffect(() => {
    if (currentStep === 3 && selectedDate) fetchSlots();
  }, [selectedDate, currentStep, fetchSlots]);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 1 && !selectedServiceId) return;
    if (currentStep === 3 && (!selectedDate || !selectedTime)) return;
    if (currentStep === 4) { handleSubmit(); return; }
    setCurrentStep(p => p + 1);
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(p => p - 1); };

  const [bookingToken, setBookingToken] = useState<string>('');
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string>('');

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !selectedServiceId || !selectedDate || !selectedTime) return;
    setIsLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          barberId: selectedBarberId,
          date: selectedDate,
          time: selectedTime,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          comment: clientComment.trim() || undefined,
          source: 'WEB',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'SLOT_TAKEN') {
          setSubmitError('Выбранное время только что заняли. Пожалуйста, вернитесь на шаг назад и выберите другой слот.');
        } else {
          setSubmitError(data.error || 'Произошла ошибка при создании записи. Попробуйте еще раз.');
        }
        setIsLoading(false);
        return;
      }

      setBookingId(data.data.id);
      setBookingToken(data.data.manageToken);
      setCreatedBooking(data.data);
      setIsSuccess(true);
      setCurrentStep(5);
    } catch (err: any) {
      setSubmitError('Не удалось связаться с сервером. Пожалуйста, проверьте подключение к сети.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Days grid ───────────────────────────────────────────────────────────────
  const dayLabels: Record<number, string> = { 0: 'Вс', 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб' };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--fg-main)', paddingBottom: '80px' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-dark)',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5,5,5,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)', fontSize: '16px', fontWeight: 700 }}>
            ← НА ГЛАВНУЮ
          </span>
        </Link>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, letterSpacing: '0.12em' }}>
          BRUTAL &amp; BLADE <span style={{ color: 'var(--color-gold)' }}>BOOKING</span>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Stepper */}
        {!isSuccess && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {/* connector line */}
              <div style={{ position: 'absolute', top: '18px', left: '10%', right: '10%', height: '2px', background: 'var(--border-dark)', zIndex: 0 }}>
                <div style={{ height: '100%', background: 'var(--color-gold)', width: `${((currentStep - 1) / 3) * 100}%`, transition: 'width 0.4s ease' }} />
              </div>

              {[{ n: 1, label: 'Услуга' }, { n: 2, label: 'Барбер' }, { n: 3, label: 'Дата и время' }, { n: 4, label: 'Контакты' }].map(item => {
                const active = currentStep === item.n;
                const done = currentStep > item.n;
                return (
                  <div key={item.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 2 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: done ? 'var(--color-gold)' : active ? 'transparent' : 'var(--bg-card)',
                      border: active ? '2px solid var(--color-gold)' : done ? 'none' : '1px solid var(--border-dark)',
                      color: done ? '#000' : active ? 'var(--color-gold)' : 'var(--fg-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14,
                      transition: 'all 0.3s'
                    }}>
                      {done ? '✓' : item.n}
                    </div>
                    <span style={{ marginTop: 6, fontSize: 12, color: active ? 'var(--color-gold)' : done ? 'var(--fg-main)' : 'var(--fg-muted)', fontWeight: active ? 600 : 400 }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ STEP 1: SERVICE ══════════ */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 6 }}>Выберите услугу</h2>
            <p style={{ color: 'var(--fg-secondary)', marginBottom: 24, fontSize: 14 }}>Выберите одну из премиальных услуг нашего барбершопа</p>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  padding: '8px 18px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: activeCategory === cat ? 'var(--color-gold)' : 'var(--bg-card)',
                  color: activeCategory === cat ? '#050505' : 'var(--fg-secondary)',
                  border: activeCategory === cat ? 'none' : '1px solid var(--border-dark)',
                  transition: 'all 0.2s'
                }}>{cat}</button>
              ))}
            </div>

            {servicesLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)' }}>Загрузка услуг из базы...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredServices.map(s => {
                  const sel = selectedServiceId === s.id;
                  return (
                    <div key={s.id} onClick={() => setSelectedServiceId(s.id)} style={{
                      background: sel ? 'rgba(196,181,136,0.08)' : 'var(--bg-card)',
                      border: sel ? '2px solid var(--color-gold)' : '1px solid var(--border-dark)',
                      borderRadius: 12, padding: 20, cursor: 'pointer',
                      boxShadow: sel ? '0 0 20px rgba(196,181,136,0.12)' : 'none',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: sel ? 'var(--color-gold)' : 'var(--fg-main)' }}>{s.name}</h3>
                          <span style={{ fontSize: 11, background: 'rgba(196,181,136,0.1)', color: 'var(--color-gold)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-gold)', alignSelf: 'flex-start' }}>{s.category}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{s.description}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-dark)', paddingTop: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>⏱ {s.durationMin} мин</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}>{s.price.toLocaleString('ru-RU')} сум</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ STEP 2: BARBER ══════════ */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 6 }}>Выберите барбера</h2>
            <p style={{ color: 'var(--fg-secondary)', marginBottom: 24, fontSize: 14 }}>Выберите мастера или позвольте системе подобрать свободного</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {/* Any barber */}
              <div onClick={() => setSelectedBarberId('any')} style={{
                background: selectedBarberId === 'any' ? 'rgba(196,181,136,0.08)' : 'var(--bg-card)',
                border: selectedBarberId === 'any' ? '2px solid var(--color-gold)' : '1px solid var(--border-dark)',
                borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s'
              }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(196,181,136,0.12)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚡</div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: selectedBarberId === 'any' ? 'var(--color-gold)' : 'var(--fg-main)' }}>Любой свободный мастер</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>Подберём мастера на удобное время</p>
                </div>
              </div>

              {barbersLoading ? (
                <div style={{ color: 'var(--fg-muted)', padding: '20px 0', fontSize: 14 }}>Загрузка мастеров...</div>
              ) : barbers.map(b => {
                const sel = selectedBarberId === b.id;
                return (
                  <div key={b.id} onClick={() => setSelectedBarberId(b.id)} style={{
                    background: sel ? 'rgba(196,181,136,0.08)' : 'var(--bg-card)',
                    border: sel ? '2px solid var(--color-gold)' : '1px solid var(--border-dark)',
                    borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-gold)', flexShrink: 0, background: '#111' }}>
                        {b.photoUrl && <img src={b.photoUrl} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: sel ? 'var(--color-gold)' : 'var(--fg-main)' }}>{b.name}</h4>
                        <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{b.role}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-gold)', marginTop: 2 }}>★ {b.rating} <span style={{ color: 'var(--fg-muted)' }}>({b.reviewsCount} отзывов)</span></div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Опыт: {b.experienceYears} лет</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: DATE & REAL SLOTS ══════════ */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 6 }}>Выберите дату и время</h2>
            <p style={{ color: 'var(--fg-secondary)', marginBottom: 24, fontSize: 14 }}>
              Реальные свободные слоты на основе расписания мастеров
            </p>

            {/* Days */}
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 10 }}>Дата</h3>
            {daysLoading ? (
              <div style={{ color: 'var(--fg-muted)', marginBottom: 24, fontSize: 14 }}>Загрузка доступных дней...</div>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 28 }}>
                {availableDays.map(d => {
                  const dt = new Date(d.date + 'T00:00:00');
                  const isSel = selectedDate === d.date;
                  const label = (() => {
                    const today = new Date().toISOString().split('T')[0];
                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    if (d.date === today) return 'Сегодня';
                    if (d.date === tomorrowStr) return 'Завтра';
                    return dayLabels[dt.getDay()];
                  })();
                  return (
                    <button key={d.date} onClick={() => d.hasSlots && setSelectedDate(d.date)} disabled={!d.hasSlots} style={{
                      minWidth: 90, padding: '12px 8px', borderRadius: 10, cursor: d.hasSlots ? 'pointer' : 'not-allowed',
                      background: isSel ? 'var(--color-gold)' : d.hasSlots ? 'var(--bg-card)' : 'rgba(255,255,255,0.03)',
                      border: isSel ? '1px solid var(--color-gold)' : '1px solid var(--border-dark)',
                      color: isSel ? '#000' : d.hasSlots ? 'var(--fg-main)' : 'var(--fg-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      opacity: d.hasSlots ? 1 : 0.4, transition: 'all 0.2s'
                    }}>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>
                        {dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                      {!d.hasSlots && <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>занято</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Time slots */}
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 10 }}>Свободное время</h3>
            {slotsLoading ? (
              <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Загрузка слотов...</div>
            ) : availableSlots.length === 0 && selectedDate ? (
              <div style={{ color: 'var(--fg-muted)', fontSize: 14, padding: '20px 0' }}>
                На выбранную дату нет свободных слотов. Выберите другой день.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 10 }}>
                {availableSlots.map(slot => {
                  const isSel = selectedTime === slot;
                  return (
                    <button key={slot} onClick={() => setSelectedTime(slot)} style={{
                      padding: '12px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      fontFamily: 'var(--font-mono)',
                      background: isSel ? 'var(--color-gold)' : 'var(--bg-card)',
                      border: isSel ? '1px solid var(--color-gold)' : '1px solid var(--border-dark)',
                      color: isSel ? '#000' : 'var(--fg-main)',
                      transition: 'all 0.2s'
                    }}>{slot}</button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ STEP 4: CONTACTS ══════════ */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, marginBottom: 6 }}>Контактные данные</h2>
            <p style={{ color: 'var(--fg-secondary)', marginBottom: 24, fontSize: 14 }}>Укажите имя и телефон для подтверждения записи</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {/* Form */}
              <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border-dark)' }}>
                {[
                  { label: 'Ваше имя *', type: 'text', val: clientName, set: setClientName, ph: 'Например: Сардор' },
                  { label: 'Телефон *', type: 'tel', val: clientPhone, set: setClientPhone, ph: '+998 90 123 45 67' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-dark)', color: 'var(--fg-main)', fontSize: 15, outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 6 }}>Комментарий (необязательно)</label>
                  <textarea rows={3} value={clientComment} onChange={e => setClientComment(e.target.value)} placeholder="Особые пожелания..."
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-dark)', color: 'var(--fg-main)', fontSize: 14, outline: 'none', resize: 'none' }} />
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: 'rgba(196,181,136,0.04)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: 'var(--color-gold)', marginBottom: 16 }}>Сводка бронирования</h3>
                  {[
                    { label: 'Услуга', value: selectedService?.name },
                    { label: 'Длительность', value: `${selectedService?.durationMin} мин` },
                    { label: 'Мастер', value: selectedBarber?.name },
                    { label: 'Дата и время', value: `${selectedDate}, ${selectedTime}`, gold: true },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                      <span style={{ color: 'var(--fg-secondary)' }}>{row.label}:</span>
                      <strong style={{ color: row.gold ? 'var(--color-gold)' : 'var(--fg-main)', textAlign: 'right', maxWidth: '60%' }}>{row.value}</strong>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>К оплате:</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}>
                    {selectedService?.price.toLocaleString('ru-RU')} сум
                  </span>
                </div>
              </div>
            </div>
            {submitError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '14px 18px', borderRadius: 8, marginTop: 20, fontSize: 14 }}>
                ⚠️ {submitError}
              </div>
            )}
          </div>
        )}

        {/* ══════════ STEP 5: SUCCESS ══════════ */}
        {isSuccess && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', maxWidth: 540, margin: '20px auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(196,181,136,0.12)', color: 'var(--color-gold)', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, marginBottom: 8 }}>Вы успешно записаны!</h2>
            <p style={{ color: 'var(--fg-secondary)', marginBottom: 20, fontSize: 14 }}>
              Номер записи: <strong style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-mono)' }}>#{bookingId}</strong>
            </p>
            <div style={{ background: 'var(--bg-dark)', padding: 20, borderRadius: 10, textAlign: 'left', marginBottom: 24, fontSize: 14, lineHeight: 1.9 }}>
              <div><strong>Клиент:</strong> {clientName} ({clientPhone})</div>
              <div><strong>Услуга:</strong> {selectedService?.name}</div>
              <div><strong>Мастер:</strong> {selectedBarber?.name}</div>
              <div><strong>Время:</strong> {selectedDate} в {selectedTime}</div>
              <div><strong>Адрес:</strong> Ташкент, ул. Шота Руставели, 45</div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {bookingToken && (
                <Link href={`/booking/${bookingToken}`} style={{ display: 'inline-block', padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--color-gold)', fontWeight: 700, borderRadius: 8, textDecoration: 'none' }}>
                  Управление записью (отмена/перенос)
                </Link>
              )}
              <Link href="/" style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--color-gold)', color: '#050505', fontWeight: 700, borderRadius: 8, textDecoration: 'none' }}>
                На главную
              </Link>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {!isSuccess && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, borderTop: '1px solid var(--border-dark)', paddingTop: 24 }}>
            {currentStep > 1
              ? <button onClick={handleBack} style={{ padding: '12px 24px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-dark)', color: 'var(--fg-main)', cursor: 'pointer', fontWeight: 600 }}>← Назад</button>
              : <div />}

            <button onClick={handleNext} disabled={
              isLoading ||
              (currentStep === 1 && !selectedServiceId) ||
              (currentStep === 3 && (!selectedDate || !selectedTime)) ||
              (currentStep === 4 && (!clientName.trim() || !clientPhone.trim()))
            } style={{
              padding: '14px 36px', borderRadius: 8, background: 'var(--color-gold)', border: 'none',
              color: '#050505', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              opacity: (isLoading || (currentStep === 1 && !selectedServiceId) || (currentStep === 3 && (!selectedDate || !selectedTime)) || (currentStep === 4 && (!clientName.trim() || !clientPhone.trim()))) ? 0.4 : 1,
              transition: 'all 0.2s'
            }}>
              {isLoading ? 'Оформление...' : currentStep === 4 ? 'Подтвердить запись' : 'Продолжить →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Page export with Suspense boundary ──────────────────────────────────────
export default function BookingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}>
        Загрузка...
      </div>
    }>
      <BookingInner />
    </Suspense>
  );
}
