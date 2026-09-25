import { Component, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatedWelcome } from '../byourside/animated-welcome';
import { Button } from '../byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { welcomeStorage } from '../../auth/welcomeStorage';

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
  const { user, status } = useAuth();
  const location = useLocation();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  if (status !== 'authenticated' || !user || dismissedFor === user.id) return null;
  if (location.pathname.startsWith('/dev/welcome')) return null;
  if (!welcomeStorage.shouldShow(user.id)) return null;

  function finish() {
    if (!user) return;
    welcomeStorage.markSeen(user.id);
    setDismissedFor(user.id);
  }

  const name = user.displayName?.trim() || user.username;

  return (
    <WelcomeErrorBoundary onContinue={finish}>
      <AnimatedWelcome key={user.id} variant="new-user" userName={name} onComplete={finish} />
    </WelcomeErrorBoundary>
  );
}
