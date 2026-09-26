import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatedWelcome } from '../byourside/animated-welcome';
import { Button } from '../byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { welcomeStorage } from '../../auth/welcomeStorage';
import {
  authTransitionMs,
  disarmAuthTransition,
  getAuthTransitionArmed,
  subscribeAuthTransition,
} from './authTransition';

class WelcomeErrorBoundary extends Component<{ onContinue: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background px-6">
          <div className="max-w-sm text-center">
            <h1 className="font-serif text-2xl text-balance">Podés entrar igual.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              La bienvenida no pudo mostrarse. El espacio sigue disponible.
            </p>
            <Button className="mt-6" onClick={this.props.onContinue}>
              Continuar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function WelcomeGate() {
  const { user, status, showReturningWelcome, clearReturningWelcome } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const transitionArmed = useSyncExternalStore(
    subscribeAuthTransition,
    getAuthTransitionArmed,
    getAuthTransitionArmed,
  );

  useEffect(() => {
    if (!transitionArmed || status !== 'authenticated' || !user) return undefined;
    const timer = window.setTimeout(() => disarmAuthTransition(), authTransitionMs());
    return () => window.clearTimeout(timer);
  }, [transitionArmed, status, user]);

  if (status !== 'authenticated' || !user) return null;
  if (location.pathname.startsWith('/dev/welcome')) return null;
  if (transitionArmed) return null;

  const showNewUser = welcomeStorage.shouldShow(user.id) && dismissedFor !== user.id;
  const showReturning = showReturningWelcome && !showNewUser;
  if (!showNewUser && !showReturning) return null;

  function finishNewUser() {
    if (!user) return;
    welcomeStorage.markSeen(user.id);
    setDismissedFor(user.id);
  }

  function finishReturning() {
    clearReturningWelcome();
    navigate('/feed', { replace: true });
  }

  const finish = showReturning ? finishReturning : finishNewUser;
  const name = showReturning
    ? (user.displayName?.trim() ?? '')
    : (user.displayName?.trim() || user.username);

  return (
    <WelcomeErrorBoundary onContinue={finish}>
      <AnimatedWelcome
        key={`${showReturning ? 'returning' : 'new'}-${user.id}`}
        variant={showReturning ? 'returning-user' : 'new-user'}
        userName={name}
        onComplete={finish}
      />
    </WelcomeErrorBoundary>
  );
}
