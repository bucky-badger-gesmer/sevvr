import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppState() {
  const currentState = useRef<AppStateStatus>(AppState.currentState);
  const [transition, setTransition] = useState<{
    from: AppStateStatus | null;
    to: AppStateStatus;
  }>({ from: null, to: AppState.currentState });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = currentState.current;
      currentState.current = nextState;
      setTransition({ from: prev, to: nextState });
    });

    return () => subscription.remove();
  }, []);

  return {
    appState: transition.to,
    previousState: transition.from,
  };
}
