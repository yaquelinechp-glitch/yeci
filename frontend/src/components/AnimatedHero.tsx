import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PHASE1_DURATION = 5500;
const STEP_INTERVAL = 750;
const CARD_INTERVAL = 3500;
const FADE_MS = 500;

export default function AnimatedHero() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [hidden, setHidden] = useState(false);
  const [phase2Step, setPhase2Step] = useState(-1);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const steps: string[] = t('landing.steps', { returnObjects: true }) as string[];
  const benefits: { title: string; desc: string }[] = t('landing.benefits', { returnObjects: true }) as any[];

  const timers = useRef<number[]>([]);

  const clearTimers = () => timers.current.forEach(id => clearTimeout(id));

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  // Phase 1 → 2
  useEffect(() => {
    if (phase !== 1) return;
    schedule(() => setHidden(true), PHASE1_DURATION);
    schedule(() => { setPhase(2); setPhase2Step(-1); setHidden(false); }, PHASE1_DURATION + FADE_MS);
    return clearTimers;
  }, [phase]);

  // Phase 2: light up steps, then → 3
  useEffect(() => {
    if (phase !== 2) return;
    let step = 0;
    const id = window.setInterval(() => {
      setPhase2Step(step);
      step++;
      if (step >= steps.length) {
        window.clearInterval(id);
        schedule(() => setHidden(true), 1200);
        schedule(() => { setPhase(3); setCardIdx(0); setFlipped(false); setHidden(false); }, 1200 + FADE_MS);
      }
    }, STEP_INTERVAL);
    return () => { window.clearInterval(id); clearTimers(); };
  }, [phase]);

  // Phase 3: flip cards in loop
  useEffect(() => {
    if (phase !== 3) return;
    const id = window.setInterval(() => {
      setFlipped(true);
      setTimeout(() => {
        setCardIdx(prev => (prev + 1) % benefits.length);
        setFlipped(false);
      }, 500);
    }, CARD_INTERVAL);
    return () => window.clearInterval(id);
  }, [phase]);

  const nextCardIdx = (cardIdx + 1) % benefits.length;

  return (
    <section className="gradient-hero relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMS0yNXYySDIzdi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 transition-opacity ease-in-out ${hidden ? 'opacity-0' : 'opacity-100'}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}>

        {/* PHASE 1 — Hero + Qué incluye */}
        {phase === 1 && (
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-[fade-in_0.6s_ease-out_both]">
              {t('landing.title')} <span className="text-accent-400">{t('landing.titleHighlight')}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed animate-[fade-in_0.6s_ease-out_0.2s_both]">
              {t('landing.subtitle')}
            </p>
            <Link to="/login" className="animate-[fade-in_0.6s_ease-out_0.4s_both] inline-block btn-primary !bg-accent-500 !text-white text-lg !px-8 !py-3 shadow-lg shadow-accent-500/30">
              {t('landing.cta')}
            </Link>

            <div className="mt-14 animate-[fade-in_0.6s_ease-out_0.8s_both]">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-8">{t('landing.ctaSecondary')}</h2>
              <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
                {benefits.map((b, i) => (
                  <div key={i}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 px-8 py-6 text-left w-64 animate-[fade-in_0.5s_ease-out_both]"
                    style={{ animationDelay: `${1 + i * 0.25}s` }}>
                    <div className="text-2xl mb-2">{['', '', ''][i]}</div>
                    <h3 className="text-white font-semibold text-base">{b.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2 — Pasos del programa alumbrándose */}
        {phase === 2 && (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 animate-[fade-in_0.5s_ease-out_both]">
              {t('landing.programTitle')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 max-w-5xl mx-auto">
              {steps.map((step, i) => {
                const lit = i <= phase2Step;
                return (
                  <div key={i}
                    className="text-center transition-all duration-500 ease-out"
                    style={{ opacity: lit ? 1 : 0.2, transform: lit ? 'scale(1)' : 'scale(0.9)' }}>
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-3 transition-all duration-500 ${lit ? 'bg-white border-accent-400 text-aconso-600 shadow-lg shadow-accent-400/30' : 'bg-white/20 border-white/20 text-white/50'}`}>
                      {i + 1}
                    </div>
                    <h3 className={`font-semibold text-sm mb-1 transition-colors duration-500 ${lit ? 'text-white' : 'text-white/40'}`}>
                      {step}
                    </h3>
                    <p className={`text-xs leading-tight transition-colors duration-500 ${lit ? 'text-white/70' : 'text-white/20'}`}>
                      {t(`landing.stepDesc${i}`) || ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 3 — Funciones del Portal (flip cards) */}
        {phase === 3 && (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 animate-[fade-in_0.5s_ease-out_both]">
              {t('landing.benefitsTitle')}
            </h2>
            <div className="flex justify-center">
              <div className="flip-perspective w-96 h-64">
                <div className={`flip-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
                  {/* Current card (front) */}
                  <div className="flip-face w-full h-full bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-8 flex flex-col items-center justify-center text-center">
                    <div className="text-5xl mb-4">{['', '', ''][cardIdx]}</div>
                    <h3 className="text-white text-xl font-bold mb-3">{benefits[cardIdx]?.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{benefits[cardIdx]?.desc}</p>
                  </div>
                  {/* Next card (back) */}
                  <div className="flip-face flip-back w-full h-full bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-8 flex flex-col items-center justify-center text-center">
                    <div className="text-5xl mb-4">{['', '', ''][nextCardIdx]}</div>
                    <h3 className="text-white text-xl font-bold mb-3">{benefits[nextCardIdx]?.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{benefits[nextCardIdx]?.desc}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Dots indicator */}
            <div className="flex justify-center gap-3 mt-8">
              {benefits.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${i === cardIdx ? 'bg-accent-400 scale-125' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
