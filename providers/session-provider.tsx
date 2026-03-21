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
const COMPLETED_SESSION_KEY = 'completed_session';

type State = {
  sessionState: SessionState;
  activeSession: ActiveSession | null;
  lastCompletedSession: CompletedSession | null;
  dismissMessage: string | null;
};

export type SessionContextType = State & {
  dispatch: (action: SessionAction) => void;
};

export const SessionContext = createContext<SessionContextType | null>(null);

function reducer(state: State, action: SessionAction): State {
  switch (action.type) {
    case 'START_HOLDING':
      return { ...state, sessionState: 'holding', dismissMessage: null };
    case 'RELEASE_HOLD':
      return { ...state, sessionState: 'idle' };
    case 'FILL_COMPLETE':
      return { ...state, sessionState: 'countdown' };
    case 'CANCEL':
      return { ...state, sessionState: 'idle', activeSession: null, dismissMessage: action.message ?? null };
    case 'SESSION_STARTED':
      return { ...state, sessionState: 'active', activeSession: action.session };
    case 'SESSION_ENDED':
      return {
        ...state,
        sessionState: 'ended',
        activeSession: null,
        lastCompletedSession: action.completed,
      };
    case 'DISMISS':
      return { ...state, sessionState: 'idle', lastCompletedSession: null, dismissMessage: null };
    default:
      return state;
  }
}

const initialState: State = {
  sessionState: 'idle',
  activeSession: null,
  lastCompletedSession: null,
  dismissMessage: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();

  const stateRef = useRef(state);
  stateRef.current = state;
  const isEndingRef = useRef(false);

  // On mount: check for completed session results or orphaned active sessions
  useEffect(() => {
    if (!user) return;

    (async () => {
      // Check for completed session waiting to show modal
      const completedRaw = await AsyncStorage.getItem(COMPLETED_SESSION_KEY);
      if (completedRaw) {
        await AsyncStorage.removeItem(COMPLETED_SESSION_KEY);
        dispatch({ type: 'SESSION_ENDED', completed: JSON.parse(completedRaw) });
        return;
      }

      // Check for orphaned active session (app was killed while session was active)
      const activeRaw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeRaw) {
        const { sessionId, startedAt } = JSON.parse(activeRaw);
        const sessionStart = new Date(startedAt);
        const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStart.getTime()) / 1000));
        const missedContent = calculateMissedContent(durationSeconds);

        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);

        // End in Supabase
        if (sessionId && sessionId !== 'pending') {
          try { await sessionService.endSession(sessionId, 'unlock', sessionStart); } catch {}
        } else {
          try {
            const s = await sessionService.startSession(user.id, sessionStart);
            await sessionService.endSession(s.id, 'unlock', sessionStart);
          } catch {}
        }

        dispatch({
          type: 'SESSION_ENDED',
          completed: { id: sessionId ?? 'local', durationSeconds, missedContent, endedReason: 'unlock' },
        });
      }
    })();
  }, [user]);

  // AppState listener — the core session lifecycle
  useEffect(() => {
    if (!user) return;

    let isStarting = false;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // Only react to definitive states, not transitional 'inactive'
      if (nextState === 'inactive') return;

      const current = stateRef.current;

      // COUNTDOWN + phone locked → START SESSION
      if (nextState === 'background' && current.sessionState === 'countdown') {
        if (isStarting) return;
        isStarting = true;

        const startedAt = new Date();

        // Write to AsyncStorage immediately
        AsyncStorage.setItem(
          ACTIVE_SESSION_KEY,
          JSON.stringify({ sessionId: null, startedAt: startedAt.toISOString() })
        );

        dispatch({
          type: 'SESSION_STARTED',
          session: { id: 'pending', startedAt },
        });

        // Create in Supabase (fire and forget — may not complete before app suspends)
        sessionService.startSession(user.id, startedAt)
          .then((session) => {
            AsyncStorage.setItem(
              ACTIVE_SESSION_KEY,
              JSON.stringify({ sessionId: session.id, startedAt: startedAt.toISOString() })
            );
            dispatch({
              type: 'SESSION_STARTED',
              session: { id: session.id, startedAt },
            });
          })
          .catch(() => {})
          .finally(() => { isStarting = false; });

        return; // Don't also check end condition in same event
      }

      // ACTIVE + user returned → end session
      // Session ends when user comes back (unlocks phone / opens app)
      if (nextState === 'active' &&
          current.sessionState === 'active' && current.activeSession) {
        if (isEndingRef.current) return;
        isEndingRef.current = true;

        const { id: sessionId, startedAt } = current.activeSession;
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000));
        const missedContent = calculateMissedContent(durationSeconds);

        const completed: CompletedSession = {
          id: sessionId,
          durationSeconds,
          missedContent,
          endedReason: 'unlock',
        };

        AsyncStorage.removeItem(ACTIVE_SESSION_KEY);

        // End in Supabase
        if (sessionId && sessionId !== 'pending') {
          sessionService.endSession(sessionId, 'unlock', startedAt).catch(() => {});
        }

        dispatch({ type: 'SESSION_ENDED', completed });
        isEndingRef.current = false;
        return;
      }

      // Returning to foreground → check for completed session to show
      if (nextState === 'active') {
        (async () => {
          const completedRaw = await AsyncStorage.getItem(COMPLETED_SESSION_KEY);
          if (completedRaw) {
            await AsyncStorage.removeItem(COMPLETED_SESSION_KEY);
            if (stateRef.current.sessionState !== 'ended') {
              dispatch({ type: 'SESSION_ENDED', completed: JSON.parse(completedRaw) });
            }
          }
        })();
      }
    });

    return () => subscription.remove();
  }, [user]);

  return (
    <SessionContext.Provider
      value={{ ...state, dispatch }}
    >
      {children}
    </SessionContext.Provider>
  );
}
