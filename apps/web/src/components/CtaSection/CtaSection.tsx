import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Phone } from 'lucide-react';
import styles from './CtaSection.module.css';

export const CtaSection: React.FC = () => {
  return (
    <section className={styles.ctaSection}>
      {/* Background Image */}
      <div className={styles.ctaBackground}>
        <div className={styles.ctaGradientOverlay} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.ctaInner}>
          <div className="section-hero-tag">
            ГОТОВЫ К ПРЕОБРАЖЕНИЮ?
          </div>
          <h2 className={styles.ctaTitle}>
            ЗАБРОНИРУЙТЕ ВИЗИТ
          </h2>
          <p className={styles.ctaSub}>
            Выберите удобное время, персонального мастера и услугу за 60 секунд.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/book" className="btn-barber-gold">
              <ArrowUpRight size={16} />
              <span>ЗАПИСАТЬСЯ ОНЛАЙН</span>
            </Link>
            <a href="tel:+998901234567" className="btn-barber-outline">
              <Phone size={15} />
              <span>+998 (90) 123-45-67</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

