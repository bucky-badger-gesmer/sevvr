import { useContext } from 'react';
import { SessionContext, type SessionContextType } from '@/providers/session-provider';

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
