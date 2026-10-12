'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { mockBarbers } from '../../data/mockData';
import styles from './Barbers.module.css';

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

export const Barbers: React.FC = () => {
  const [barbers, setBarbers] = useState<BarberData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/barbers')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setBarbers(json.data);
        } else {
          setBarbers(mockBarbers.map(b => ({
            id: b.id, name: b.name, role: b.role, bio: b.bio,
            photoUrl: b.avatarUrl, experienceYears: b.experienceYears,
            rating: b.rating, reviewsCount: b.reviewsCount,
          })));
        }
      })
      .catch(() => {
        setBarbers(mockBarbers.map(b => ({
          id: b.id, name: b.name, role: b.role, bio: b.bio,
          photoUrl: b.avatarUrl, experienceYears: b.experienceYears,
          rating: b.rating, reviewsCount: b.reviewsCount,
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="barbers" className={`section-pad ${styles.barbersSection}`}>
      {/* Background Image */}
      <div className={styles.barbersBackground}>
        <div className={styles.barbersGradientOverlay} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.sectionHeader}>
          <div className="section-hero-tag">
            НАША КОМАНДА
          </div>
          <h2 className="gold-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            НАШИ <span>БАРБЕРЫ</span>
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-muted)' }}>
            Загрузка мастеров...
          </div>
        ) : (
          <div className={styles.barbersGrid}>
            {barbers.map((b) => (
              <div key={b.id} className={styles.barberCard}>
                <div className={styles.imageFrame}>
                  <img src={b.photoUrl || ''} alt={b.name} className={styles.avatarImg} />
                  <div className={styles.ratingBadge}>
                    <Star size={12} fill="#C4B588" color="#C4B588" />
                    <span>{b.rating}</span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.barberRole}>{b.role}</span>
                  <h3 className={styles.barberName}>{b.name}</h3>
                  <p className={styles.barberBio}>{b.bio}</p>
                  <div className={styles.ctaWrap}>
                    <Link href={`/book?barberId=${b.id}`} className="btn-barber-outline" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}>
                      <span>ЗАПИСАТЬСЯ К {b.name.split(' ')[0].toUpperCase()}</span>
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

