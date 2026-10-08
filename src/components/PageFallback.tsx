import { Spinner } from './byourside/ui';

/**
 * Mientras se baja el código de una pantalla (React.lazy). El spinner aparece
 * recién a los 300 ms: en una conexión buena no llega a verse y no hay parpadeo.
 */
export function PageFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? 'flex min-h-dvh items-center justify-center bg-background' : 'flex justify-center py-16'}>
      <Spinner className="animate-delayed-appear" />
    </div>
  );
}
