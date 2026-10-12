'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scissors, Clock } from 'lucide-react';
import { mockServices } from '../../data/mockData';
import styles from './Services.module.css';

interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  category: string;
}

export const Services: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/services')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setServices(json.data);
        } else {
          // Fallback to mocks
          setServices(mockServices as any);
        }
      })
      .catch(() => {
        setServices(mockServices as any);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'all', label: 'ВСЕ УСЛУГИ' },
    { id: 'Стрижки', label: 'СТРИЖКИ' },
    { id: 'Борода', label: 'БОРОДА' },
    { id: 'Комплексы', label: 'КОМПЛЕКСЫ' },
    { id: 'Бритьё', label: 'КОРОЛЕВСКОЕ БРИТЬЁ' },
  ];

  const filtered = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <section id="services" className={`section-pad ${styles.servicesSection}`}>
      {/* Background Image */}
      <div className={styles.servicesBackground}>
        <div className={styles.servicesGradientOverlay} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <div className="section-hero-tag">
            МАСТЕРСТВО И ПРАЙС
          </div>
          <h2 className="gold-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            УСЛУГИ <span>И ЦЕНЫ</span>
          </h2>
        </div>

        {/* Filter Categories */}
        <div className={styles.filterRow}>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`${styles.filterBtn} ${activeCategory === c.id ? styles.activeFilter : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Services Grid matching Gentleman theme */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)' }}>
            Загрузка услуг...
          </div>
        ) : (
          <div className={styles.servicesGrid}>
            {filtered.map((s) => (
              <div key={s.id} className={styles.serviceItem}>
                <div className={styles.serviceMain}>
                  <div className={styles.serviceHeader}>
                    <h3 className={styles.serviceName}>{s.name}</h3>
                    <div className={styles.dottedLine} />
                    <div className={styles.servicePrice}>{s.price.toLocaleString('ru-RU')} сум</div>
                  </div>
                  <p className={styles.serviceDescription}>{s.description}</p>
                  <div className={styles.serviceFooter}>
                    <span className={styles.serviceDuration}>
                      <Clock size={13} color="var(--color-gold)" />
                      {s.durationMin} МИН
                    </span>
                    <Link href={`/book?serviceId=${s.id}`} className={styles.bookBtn}>
                      <span>ЗАПИСАТЬСЯ</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

