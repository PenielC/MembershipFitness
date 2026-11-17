import { useCallback, useEffect, useRef, useState } from 'react';
import type { Feedback } from './components/ui';

/** Holds a success/error message that clears itself after a few seconds. */
export function useFeedback(ms = 4000): [Feedback | null, (f: Feedback) => void] {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback(
    (f: Feedback) => {
      clearTimeout(timer.current);
      setFeedback(f);
      timer.current = setTimeout(() => setFeedback(null), ms);
    },
    [ms],
  );
  return [feedback, show];
}
