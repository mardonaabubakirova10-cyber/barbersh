import React from 'react';
import Link from 'next/link';
import { Sparkles, Award, Coffee, ShieldCheck } from 'lucide-react';
import { mockShopInfo } from '../../data/mockData';
import styles from './Features.module.css';

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles size={22} />,
  award: <Award size={22} />,
  coffee: <Coffee size={22} />,
  'shield-check': <ShieldCheck size={22} />,
};

export const Features: React.FC = () => {
  return (
    <section id="about" className={styles.aboutSection}>
      {/* Background B&W Barber Photo */}
      <div className={styles.aboutBackground}>
        <div className={styles.aboutGradientOverlay} />
      </div>

      <div className={`container ${styles.aboutContainer}`}>
        <div className={styles.layout}>
          {/* Left column — story text */}
          <div className={styles.storyCol}>
            <div className={styles.indexTag}>/ 01</div>
            <h2 className={styles.aboutTitle}>О НАС</h2>
            <div className="section-hero-tag" style={{ marginBottom: '24px' }}>
              БЕЗУПРЕЧНЫЕ СТРИЖКИ
            </div>

            <p className={styles.leadPara}>
              Барбершоп — это больше, чем просто стрижка. Это место мужской культуры, традиций и непринуждённого общения.
            </p>

            <p className={styles.bodyPara}>
              Мы сохраняем истинные традиции классического барберинга. Каждая стрижка и моделирование бороды выполняются с ювелирной точностью, премиальной косметикой и уважением к вашему персональному стилю.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/book" className="btn-barber-outline">
                <span style={{ color: 'var(--color-gold)' }}>→</span>
                <span>ЗАПИСАТЬСЯ</span>
              </Link>
            </div>
          </div>

          {/* Right column — advantages grid */}
          <div className={styles.featuresCol}>
            {mockShopInfo.features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  {iconMap[f.icon] || <Sparkles size={22} />}
                </div>
                <div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

