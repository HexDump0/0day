import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import Ticker from './components/Ticker.tsx';
import Program from './components/Program.tsx';
import Tracks from './components/Tracks.tsx';
import HowItWorks from './components/HowItWorks.tsx';
import Faq from './components/Faq.tsx';
import FinalCta from './components/FinalCta.tsx';
import Footer from './components/Footer.tsx';
import { useReveals } from './hooks/useReveals.ts';

export default function App() {
  useReveals();
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Ticker />
        <Program />
        <Tracks />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
