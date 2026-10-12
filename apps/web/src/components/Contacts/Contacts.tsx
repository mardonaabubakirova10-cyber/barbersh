import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Send } from 'lucide-react';
import { mockShopInfo } from '../../data/mockData';
import styles from './Contacts.module.css';

export const Contacts: React.FC = () => {
  return (
    <section id="contacts" className={`section-pad ${styles.contactsSection}`}>
      {/* Background Image */}
      <div className={styles.contactsBackground}>
        <div className={styles.contactsGradientOverlay} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className={styles.contactsGrid}>
          <div className={styles.infoCol}>
            <div className="section-hero-tag">
              ЛОКАЦИЯ И ЗАПИСЬ
            </div>
            <h2 className="gold-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', marginBottom: '32px' }}>
              НАШ <span>САЛОН</span>
            </h2>

            <div className={styles.itemRow}>
              <MapPin size={20} color="var(--color-gold)" />
              <div>
                <strong>АДРЕС</strong>
                <p>{mockShopInfo.address} ({mockShopInfo.metro})</p>
              </div>
            </div>

            <div className={styles.itemRow}>
              <Clock size={20} color="var(--color-gold)" />
              <div>
                <strong>РЕЖИМ РАБОТЫ</strong>
                <p>{mockShopInfo.workingHours}</p>
              </div>
            </div>

            <div className={styles.itemRow}>
              <Phone size={20} color="var(--color-gold)" />
              <div>
                <strong>ТЕЛЕФОН</strong>
                <a href={`tel:${mockShopInfo.phoneRaw}`} className={styles.phoneLink}>{mockShopInfo.phone}</a>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Link href="/book" className="btn-barber-gold">
                <span>ЗАПИСАТЬСЯ ОНЛАЙН</span>
                <span>→</span>
              </Link>
              <a href={mockShopInfo.telegram} target="_blank" rel="noopener noreferrer" className="btn-barber-outline">
                <Send size={15} />
                <span>TELEGRAM БОТ</span>
              </a>
            </div>
          </div>

          <div className={styles.mapCol}>
            <iframe
              title="Yandex Map Tashkent"
              src="https://yandex.ru/map-widget/v1/?ll=69.2787%2C41.2995&z=15&l=map&pt=69.2787,41.2995,pm2rdm"
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={true}
              className={styles.mapFrame}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
