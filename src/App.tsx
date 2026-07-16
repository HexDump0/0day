import { useEffect } from 'react';
import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import Brief from './components/Brief.tsx';
import Proof from './components/Proof.tsx';
import Rules from './components/Rules.tsx';
import HowItWorks from './components/HowItWorks.tsx';
import Faq from './components/Faq.tsx';
import FinalCta from './components/FinalCta.tsx';
import Footer from './components/Footer.tsx';
import { useReveals } from './hooks/useReveals.ts';

export default function App() {
  useReveals();

  useEffect(() => {
    if (!window.location.hash) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector(window.location.hash);
      if (!target) return;
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      target.scrollIntoView();
      requestAnimationFrame(() => {
        root.style.scrollBehavior = previous;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Brief />
        <HowItWorks />
        <Proof />
        <Rules />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
