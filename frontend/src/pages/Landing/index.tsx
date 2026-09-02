import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../../components/layout/Header';

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
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {t('landing.title')} <span className="text-accent-400">{t('landing.titleHighlight')}</span>
                </h1>
                <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
                  {t('landing.subtitle')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/login" className="btn-primary !bg-accent-500 !text-white text-lg !px-8 !py-3.5 shadow-lg shadow-accent-500/30">
                    {t('landing.cta')}
                  </Link>
                  <a href="#program" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10 text-lg !px-8 !py-3.5">
                    {t('landing.ctaSecondary')}
                  </a>
                </div>
              </div>
              <div className="hidden md:flex justify-center animate-slide-up">
                <div className="relative">
                  <div className="w-80 h-80 bg-white/10 backdrop-blur-sm rounded-[30px] border border-white/20 p-8 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {benefits.slice(0, 4).map((b, i) => (
                        <div key={i} className="bg-white/20 rounded-2xl p-4 text-center">
                          <div className="text-3xl mb-1">{['', '', '', ''][i]}</div>
                          <div className="text-white text-sm font-medium leading-tight">{b.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-500 rounded-full flex items-center justify-center animate-pulse-amber">
                    <span className="text-2xl"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Journey Steps - Simple Timeline */}
        <section id="program" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.programTitle')}</h2>
            </div>
            <div className="space-y-16">
              {/* Row 1: steps 0-5 */}
              <div className="relative">
                <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-aconso-500 via-accent-500 to-aconso-500"></div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                  {steps.slice(0, 6).map((step: string, i: number) => (
                    <div key={step} className="text-center relative group">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-aconso-500 flex items-center justify-center text-xl md:text-2xl font-bold text-aconso-600 mx-auto mb-4 shadow-lg relative z-10 group-hover:border-accent-500 group-hover:text-accent-600 transition-all duration-300">
                        {i + 1}
                      </div>
                      <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-1">{step}</h3>
                      <p className="text-xs text-gray-500 leading-tight">{t(`landing.stepDesc${i}`) || ''}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Row 2: steps 6-10 */}
              <div className="relative">
                <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-aconso-500 via-accent-500 to-aconso-500"></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
                  {steps.slice(6).map((step: string, i: number) => {
                    const idx = i + 6;
                    return (
                      <div key={step} className="text-center relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-4 border-aconso-500 flex items-center justify-center text-xl md:text-2xl font-bold text-aconso-600 mx-auto mb-4 shadow-lg relative z-10 group-hover:border-accent-500 group-hover:text-accent-600 transition-all duration-300">
                          {idx + 1}
                        </div>
                        <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-1">{step}</h3>
                        <p className="text-xs text-gray-500 leading-tight">{t(`landing.stepDesc${idx}`) || ''}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.benefitsTitle')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((b: any, i: number) => (
                <div key={i} className="card card-interactive p-8 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-2xl mb-5 group-hover:bg-accent-100 transition-colors">
                    {['', '', '', '', '', ''][i]}
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-gray-800">{b.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-accent-500 to-accent-600">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t('landing.ctaTitle')}</h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">{t('landing.ctaDesc')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login" className="bg-white text-accent-600 px-8 py-4 rounded-[11px] font-bold text-lg hover:bg-gray-100 transition shadow-lg">
                {t('landing.ctaBtn')}
              </Link>
              <a href="#program" className="border-2 border-white text-white px-8 py-4 rounded-[11px] font-bold text-lg hover:bg-white/10 transition">
                {t('landing.ctaSecondary')}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="dark-section py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">aconso</span>
                <span className="text-accent-400 font-normal">Partner Academy</span>
              </div>
              <p className="text-white/60 max-w-sm">{t('landing.footerTagline')}</p>
              <div className="flex gap-4">
                <Link to="/login" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Login">in</Link>
                <Link to="/register" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Register">yt</Link>
                <Link to="/" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition" title="Home">x</Link>
              </div>
            </div>
            <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
              {t('landing.footerCopyright')}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
