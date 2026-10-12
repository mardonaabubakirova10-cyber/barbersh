import React from 'react';
import { Header } from '../components/Header/Header';
import { Hero } from '../components/Hero/Hero';
import { Features } from '../components/Features/Features';
import { Services } from '../components/Services/Services';
import { Barbers } from '../components/Barbers/Barbers';
import { Reviews } from '../components/Reviews/Reviews';
import { Contacts } from '../components/Contacts/Contacts';
import { CtaSection } from '../components/CtaSection/CtaSection';
import { Footer } from '../components/Footer/Footer';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Hero />
      <Features />
      <Services />
      <Barbers />
      <Reviews />
      <Contacts />
      <CtaSection />
      <Footer />
    </main>
  );
}
