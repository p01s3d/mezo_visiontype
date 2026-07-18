import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Becomes true once when the element intersects the viewport (or immediately
 * under prefers-reduced-motion). Stays true afterward so enter animations
 * don't replay on scroll-away.
 */
export function useInViewOnce<T extends Element = HTMLDivElement>(
  options?: IntersectionObserverInit,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (inView) return;

    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
        ...optionsRef.current,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView];
}
