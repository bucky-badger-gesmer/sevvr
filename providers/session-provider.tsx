import { createContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SessionState,
  SessionAction,
  ActiveSession,
  CompletedSession,
} from '@/types/session';
import { useAuth } from '@/hooks/use-auth';
import * as sessionService from '@/lib/session-service';
import { calculateMissedContent } from '@/constants/missed-content';

const ACTIVE_SESSION_KEY = 'active_session';

type State = {
  sessionState: SessionState;
  activeSession: ActiveSession | null;
  lastCompletedSession: CompletedSession | null;
};

export type SessionContextType = State & {
  dispatch: (action: SessionAction) => void;
  startSession: () => Promise<void>;
  endSession: (reason: 'unlock' | 'movement' | 'cancel') => Promise<void>;
};

export const SessionContext = createContext<SessionContextType | null>(null);

function reducer(state: State, action: SessionAction): State {
  switch (action.type) {
    case 'START_HOLDING':
      return { ...state, sessionState: 'holding' };
    case 'RELEASE_HOLD':
      return { ...state, sessionState: 'idle' };
    case 'FILL_COMPLETE':
      return { ...state, sessionState: 'countdown' };
    case 'COUNTDOWN_COMPLETE':
      return state;
    case 'CANCEL':
      return { ...state, sessionState: 'idle', activeSession: null };
    case 'SESSION_STARTED':
      return { ...state, sessionState: 'active', activeSession: action.session };
    case 'SESSION_ENDED':
      return {
        ...state,
        sessionState: 'ended',
        activeSession: null,
        lastCompletedSession: action.completed,
      };
    case 'RESTORE_SESSION':
      return { ...state, sessionState: 'active', activeSession: action.session };
    case 'DISMISS':
      return { ...state, sessionState: 'idle', lastCompletedSession: null };
    default:
      return state;
  }
}

const initialState: State = {
  sessionState: 'idle',
  activeSession: null,
  lastCompletedSession: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  const stateRef = useRef(state);
  stateRef.current = state;
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const wasBackgroundedRef = useRef(false);

  // On mount: if there's a stored active session, end it immediately.
  // We're in the foreground now, which means the user came back from background.
  // Expo Go kills the component tree on background, so this is the only
  // reliable way to detect "user was away and came back".
  // Computes duration locally so it works even if Supabase calls fail.
  useEffect(() => {
    if (!user) return;

    (async () => {
      const stored = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (!stored) return;

      const { sessionId, startedAt } = JSON.parse(stored);
      const sessionStart = new Date(startedAt);

      // Always clean up AsyncStorage first
      await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);

      // Compute duration locally — this always works
      const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 1000));
      const missedContent = calculateMissedContent(durationSeconds);

      // End session in Supabase via SECURITY DEFINER RPC (bypasses RLS)
      try {
        const result = await sessionService.endSession(sessionId, 'unlock', sessionStart);
        // Use server duration if available
        dispatch({
          type: 'SESSION_ENDED',
          completed: {
            id: sessionId,
            durationSeconds: result.durationSeconds,
            missedContent: result.missedContent,
            endedReason: 'unlock',
          },
        });
      } catch {
        // RPC failed — show modal with locally computed values anyway
        dispatch({
          type: 'SESSION_ENDED',
          completed: {
            id: sessionId,
            durationSeconds,
            missedContent,
            endedReason: 'unlock',
          },
        });
      }
    })();
  }, [user]);

  // Direct AppState listener — simple backgrounded flag approach
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const current = stateRef.current;

      // Track when app goes to background
      if (nextState === 'background' || nextState === 'inactive') {
        if (current.sessionState === 'active') {
          wasBackgroundedRef.current = true;
        }
      }

      // When app returns to active: end session if it was backgrounded
      if (nextState === 'active' && wasBackgroundedRef.current) {
        wasBackgroundedRef.current = false;

        if (current.sessionState === 'active' && current.activeSession) {
          if (isEndingRef.current) return;
          isEndingRef.current = true;

          const sessionId = current.activeSession.id;
          (async () => {
            try {
              const result = await sessionService.endSession(sessionId, 'unlock');
              await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
              dispatch({
                type: 'SESSION_ENDED',
                completed: {
                  id: sessionId,
                  durationSeconds: result.durationSeconds,
                  missedContent: result.missedContent,
                  endedReason: 'unlock',
                },
              });
            } catch {
              await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
              dispatch({ type: 'CANCEL' });
            } finally {
              isEndingRef.current = false;
            }
          })();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const startSessionManual = useCallback(async () => {
    if (!user) return;
    if (isStartingRef.current) return;
    if (stateRef.current.sessionState === 'active') return;

    isStartingRef.current = true;
    try {
      const session = await sessionService.startSession(user.id);
      const activeSession: ActiveSession = {
        id: session.id,
        startedAt: new Date(session.started_at),
      };
      await AsyncStorage.setItem(
        ACTIVE_SESSION_KEY,
        JSON.stringify({ sessionId: session.id, startedAt: session.started_at })
      );
      dispatch({ type: 'SESSION_STARTED', session: activeSession });
    } catch {
      dispatch({ type: 'CANCEL' });
    } finally {
      isStartingRef.current = false;
    }
  }, [user]);

  const endSessionManual = useCallback(
    async (reason: 'unlock' | 'movement' | 'cancel') => {
      const current = stateRef.current;
      if (!current.activeSession) return;
      if (isEndingRef.current) return;

      isEndingRef.current = true;
      const sessionId = current.activeSession.id;
      try {
        const result = await sessionService.endSession(sessionId, reason);
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        dispatch({
          type: 'SESSION_ENDED',
          completed: {
            id: sessionId,
            durationSeconds: result.durationSeconds,
            missedContent: result.missedContent,
            endedReason: reason,
          },
        });
      } catch {
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        dispatch({ type: 'CANCEL' });
      } finally {
        isEndingRef.current = false;
      }
    },
    []
  );

  return (
    <SessionContext.Provider
      value={{
        ...state,
        dispatch,
        startSession: startSessionManual,
        endSession: endSessionManual,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
