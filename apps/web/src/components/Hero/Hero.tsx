import React from 'react';
import Link from 'next/link';
import { Quote, ArrowRight, CalendarCheck, Star } from 'lucide-react';
import styles from './Hero.module.css';
import { mockShopInfo } from '../../data/mockData';

export const Hero: React.FC = () => {
  return (
    <section id="home" className={styles.heroSection}>
      {/* Full Background Video with fallback */}
      <div className={styles.heroBackground}>
        <video
          className={styles.heroVideo}
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.heroGradientOverlay} />
      </div>

      {/* Decorative gold vertical line */}
      <div className={styles.heroDecorLine} />

      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          {/* Subtitle tag with gold horizontal line */}
          <div className="section-hero-tag">
            МУЖСКИЕ СТРИЖКИ И БРИТЬЁ
          </div>

          {/* Golden Big Title */}
          <h1 className="gold-title">
            СТИЛЬ ДЛЯ <br />
            ТЕХ, КТО <br />
            В ДВИЖЕНИИ
          </h1>

          {/* Quote Badge */}
          <div className="quote-badge" style={{ marginTop: '36px', marginBottom: '36px' }}>
            <div className="quote-icon-box">
              <Quote size={18} fill="currentColor" />
            </div>
            <span>
              ЕСЛИ ПОСТОЯННО ПРОХОДИТЬ МИМО БАРБЕРА, <br />
              РАНО ИЛИ ПОЗДНО ПРИДЕТСЯ ПОДСТРИЧЬСЯ.
            </span>
          </div>

          {/* Action Buttons */}
          <div className={styles.ctaWrap}>
            <Link href="/book" className="btn-barber-gold">
              <CalendarCheck size={16} />
              <span>ЗАПИСАТЬСЯ ОНЛАЙН</span>
            </Link>
            <a href="#services" className="btn-barber-outline">
              <span>НАШИ УСЛУГИ</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Stats Block */}
        <div className={styles.heroStats}>
          {mockShopInfo.stats.map((stat, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

