import React from 'react';
import { Quote } from 'lucide-react';
import { mockReviews } from '../../data/mockData';
import styles from './Reviews.module.css';

export const Reviews: React.FC = () => {
  return (
    <section id="reviews" className={`section-pad ${styles.reviewsSection}`}>
      {/* Background Image */}
      <div className={styles.reviewsBackground}>
        <div className={styles.reviewsGradientOverlay} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.sectionHeader}>
          <div className="section-hero-tag">
            ОТЗЫВЫ ГОСТЕЙ
          </div>
          <h2 className="gold-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
            ИСТОРИИ <span>КЛИЕНТОВ</span>
          </h2>
        </div>

        <div className={styles.reviewsGrid}>
          {mockReviews.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.quoteIconBox}>
                <Quote size={28} fill="var(--color-gold)" color="var(--color-gold)" />
              </div>
              <p className={styles.reviewText}>«{r.text}»</p>
              <div className={styles.reviewAuthor}>
                <strong>{r.author}</strong>
                <span>{r.service} • {r.barberName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
