'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scissors, Menu, X, ArrowRight } from 'lucide-react';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.headerInner}`}>
        {/* Brand Logo exactly as reference: XET BARBER */}
        <Link href="/" className={styles.brand} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.brandIconWrap}>
            <Scissors size={18} className={styles.brandIcon} />
          </div>
          <span className={styles.brandName}>BLACK BARBER</span>
        </Link>

        {/* Center Nav */}
        <nav className={styles.nav}>
          <a href="#home" className={`${styles.navLink} ${styles.activeLink}`}>ГЛАВНАЯ</a>
          <a href="#about" className={styles.navLink}>О НАС</a>
          <a href="#services" className={styles.navLink}>УСЛУГИ</a>
          <a href="#barbers" className={styles.navLink}>МАСТЕРА</a>
          <a href="#reviews" className={styles.navLink}>ОТЗЫВЫ</a>
          <a href="#contacts" className={styles.navLink}>КОНТАКТЫ</a>
        </nav>

        {/* Right CTA */}
        <div className={styles.actions}>
          <a href="tel:+998901234567" className={styles.phoneText}>
            +998 (90) 123-45-67
          </a>
          <Link href="/book" className="btn-barber-outline" style={{ padding: '9px 18px', fontSize: '0.74rem' }}>
            <span>ЗАПИСАТЬСЯ</span>
            <ArrowRight size={13} />
          </Link>
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay}>
          <nav className={styles.mobileNav}>
            <a href="#home" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>ГЛАВНАЯ</a>
            <a href="#about" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>О НАС</a>
            <a href="#services" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>УСЛУГИ</a>
            <a href="#barbers" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>МАСТЕРА</a>
            <a href="#reviews" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>ОТЗЫВЫ</a>
            <a href="#contacts" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>КОНТАКТЫ</a>
            <div style={{ marginTop: '20px' }}>
              <Link href="/book" className="btn-barber-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                <span>ЗАПИСАТЬСЯ ОНЛАЙН</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
