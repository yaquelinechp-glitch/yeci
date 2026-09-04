import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';
import Reveal from '../../components/ui/Reveal';

export default function Landing() {
  const { t } = useTranslation();
  const steps: string[] = t('landing.steps', { returnObjects: true }) as string[];
  const benefits: { title: string; desc: string }[] = t('landing.benefits', { returnObjects: true }) as any[];

  return (
    <>
      <Header />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMS0yNXYySDIzdi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
          <div className="max-w-6xl mx-auto px-6 py-14 md:py-16 relative">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Reveal direction="up" delay={1} immediate>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    {t('landing.title')} <span className="text-accent-400">{t('landing.titleHighlight')}</span>
                  </h1>
                </Reveal>
                <Reveal direction="up" delay={2} immediate>
                  <p className="text-base md:text-lg text-white/80 mb-6 max-w-lg leading-relaxed">
                    {t('landing.subtitle')}
                  </p>
                </Reveal>
                <Reveal direction="up" delay={3} immediate>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/login" className="btn-primary !bg-accent-500 !text-white text-base !px-6 !py-2.5 shadow-lg shadow-accent-500/30">
                      {t('landing.cta')}
                    </Link>
                    <a href="#program" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10 text-base !px-6 !py-2.5">
                      {t('landing.ctaSecondary')}
                    </a>
                  </div>
                </Reveal>
              </div>
              <Reveal direction="right" delay={2} immediate className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 lg:w-72 lg:h-72 bg-white/10 backdrop-blur-sm rounded-[30px] border border-white/20 p-6 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {benefits.slice(0, 4).map((b, i) => (
                        <div key={i} className="bg-white/20 rounded-2xl p-4 text-center">
                          <div className="text-3xl mb-1">{['', '', '', ''][i]}</div>
                          <div className="text-white text-sm font-medium leading-tight">{b.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center animate-pulse-amber">
                    <span className="text-2xl"></span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Partner Journey Steps - Simple Timeline */}
        <section id="program" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal immediate>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('landing.programTitle')}</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-8">
              {steps.map((step: string, i: number) => (
                <Reveal key={step} delay={(i % 5) + 1} direction="zoom" immediate>
                  <div className="text-center relative group">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-4 border-aconso-500 flex items-center justify-center text-lg md:text-xl font-bold text-aconso-600 mx-auto mb-3 shadow-lg relative z-10 group-hover:border-accent-500 group-hover:text-accent-600 transition-all duration-300">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-1">{step}</h3>
                    <p className="text-xs text-gray-500 leading-tight">{t(`landing.stepDesc${i}`) || ''}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal immediate>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('landing.benefitsTitle')}</h2>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {benefits.map((b: any, i: number) => (
                <Reveal key={i} delay={(i % 3) + 1} immediate>
                  <div className="card card-interactive p-6 group cursor-default h-full">
                    <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-accent-100 transition-colors">
                      {['', '', '', '', '', ''][i]}
                    </div>
                    <h3 className="font-bold text-base mb-2 text-gray-800">{b.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

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
