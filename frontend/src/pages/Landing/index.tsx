import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';
import AnimatedHero from '../../components/AnimatedHero';
import Reveal from '../../components/ui/Reveal';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <>
      <Header />
      <div className="pt-16">
        <AnimatedHero />

        {/* CTA Section */}
        <section className="py-14 bg-gradient-to-r from-accent-500 to-accent-600">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Reveal immediate>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('landing.ctaTitle')}</h2>
            </Reveal>
            <Reveal delay={1} immediate>
              <p className="text-white/90 text-base mb-6 max-w-2xl mx-auto">{t('landing.ctaDesc')}</p>
            </Reveal>
            <Reveal delay={2} immediate>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/login" className="bg-white text-accent-600 px-6 py-3 rounded-[11px] font-bold text-base hover:bg-gray-100 transition shadow-lg">
                  {t('landing.ctaBtn')}
                </Link>
                <a href="#program" className="border-2 border-white text-white px-6 py-3 rounded-[11px] font-bold text-base hover:bg-white/10 transition">
                  {t('landing.ctaSecondary')}
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="dark-section py-10">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal immediate>
              <div className="flex flex-col items-center text-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">aconso</span>
                  <span className="text-accent-400 font-normal">Partner Academy</span>
                </div>
                <p className="text-white/60 max-w-sm text-sm">{t('landing.footerTagline')}</p>
                <div className="flex gap-4">
                  <Link to="/login" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Login">in</Link>
                  <Link to="/register" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Register">yt</Link>
                  <Link to="/" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Home">x</Link>
                </div>
              </div>
              <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/40 text-sm">
                {t('landing.footerCopyright')}
              </div>
            </Reveal>
          </div>
        </footer>
      </div>
    </>
  );
}
