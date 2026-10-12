import React from 'react';
import Link from 'next/link';
import { mockShopInfo } from '../../data/mockData';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className="container">
        {/* Top Big Footer Banner */}
        <div className={styles.bigBanner}>
          <span className={styles.bigName}>BLACK BARBER</span>
          <span className={styles.bigCity}>ТАШКЕНТ</span>
        </div>

        {/* Links Grid */}
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <span className="label-mono">АТЕЛЬЕ</span>
            <p className={styles.colDesc}>
              Премиальная система записи и сервис мужского стиля. Традиции классического бритья и современных техник стрижки.
            </p>
          </div>

          <div className={styles.footerCol}>
            <span className="label-mono">НАВИГАЦИЯ</span>
            <ul className={styles.linkList}>
              <li><a href="#about">01. О нас</a></li>
              <li><a href="#services">02. Услуги и цены</a></li>
              <li><a href="#barbers">03. Мастера</a></li>
              <li><a href="#reviews">04. Отзывы</a></li>
              <li><a href="#contacts">05. Контакты</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <span className="label-mono">ПОПУЛЯРНЫЕ УСЛУГИ</span>
            <ul className={styles.linkList}>
              <li><Link href="/book?serviceId=1">Мужская стрижка</Link></li>
              <li><Link href="/book?serviceId=2">Стрижка бороды</Link></li>
              <li><Link href="/book?serviceId=3">Комплекс «Стрижка + Борода»</Link></li>
              <li><Link href="/book?serviceId=4">Королевское бритьё</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <span className="label-mono">КОНТАКТЫ</span>
            <div className={styles.contactItem}>{mockShopInfo.phone}</div>
            <div className={styles.contactItem}>{mockShopInfo.address}</div>
            <div className={styles.contactItem}>{mockShopInfo.workingHours}</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div>© {new Date().getFullYear()} BLACK BARBER. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</div>
          <div className="label-mono">КУЛЬТУРА МУЖСКОГО СТИЛЯ</div>
        </div>
      </div>
    </footer>
  );
};
