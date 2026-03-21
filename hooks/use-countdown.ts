import { useState, useRef, useCallback, useEffect } from 'react';

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setSecondsLeft(initialSeconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clear();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, clear]);

  const cancel = useCallback(() => {
    clear();
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  }, [initialSeconds, clear]);

  useEffect(() => clear, [clear]);

  return { secondsLeft, isRunning, start, cancel };
}
