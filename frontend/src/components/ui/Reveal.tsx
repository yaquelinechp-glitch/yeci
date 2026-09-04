import { useEffect, useRef, useState, type ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'zoom';

interface Props {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'span';
}

const DIR_CLASS: Record<Direction, string> = {
  up: '',
  left: ' left',
  right: ' right',
  zoom: ' zoom',
};

export default function Reveal({ children, direction = 'up', delay = 0, className = '', as = 'div' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as;
  const delayClass = delay ? ` reveal-delay-${delay}` : '';

  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? ` reveal-visible${DIR_CLASS[direction]}${delayClass}` : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Tag>
  );
}
