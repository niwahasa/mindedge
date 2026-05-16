import { useState, useEffect, useRef, useCallback } from 'react';
import { getGreetingTime, getTradingSession } from '@/utils/helpers';

export function useCountUp(end: number, duration = 600, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!startOnMount) return;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setValue(Math.round(eased * end));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, startOnMount]);

  return value;
}

export function useSession() {
  const [session, setSession] = useState(() => getTradingSession());

  useEffect(() => {
    const interval = setInterval(() => setSession(getTradingSession()), 60000);
    return () => clearInterval(interval);
  }, []);

  return session;
}

export function useGreeting() {
  return useState(() => getGreetingTime())[0];
}

export function useStaggeredEnter(_count: number, baseDelay = 60) {
  return useCallback(
    (index: number) => ({
      animationDelay: `${index * baseDelay}ms`,
    }),
    [baseDelay]
  );
}
