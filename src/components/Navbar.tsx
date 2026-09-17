import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-mist bg-paper">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link to="/feed" className="flex items-center gap-2">
          <Logo />
          <span className="font-serif text-xl font-semibold text-ink">ByYourSide</span>
        </Link>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <Link to="/help" className="text-sm font-medium text-calm hover:text-calm/80">
            Ayuda
          </Link>
          <Link to="/discover" className="text-sm text-dusk transition-colors hover:text-ink">
            Descubrir
          </Link>
          <span className="hidden text-sm text-dusk sm:inline">
            {user?.displayName || user?.username}
          </span>
          <button onClick={logout} className="text-sm text-dusk transition-colors hover:text-ink">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}