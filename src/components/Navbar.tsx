import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import { useChatNotifications } from '../context/ChatNotificationsContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useChatNotifications();

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
          <Link to="/messages" className="relative text-sm text-dusk transition-colors hover:text-ink">
            Mensajes
            {unreadCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-calm text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {user && (
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2">
              <Avatar avatarUrl={user.avatarUrl} name={user.displayName || user.username} size="sm" />
              <span className="hidden text-sm text-dusk hover:text-ink sm:inline">
                {user.displayName || user.username}
              </span>
            </Link>
          )}

          <button onClick={logout} className="text-sm text-dusk transition-colors hover:text-ink">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}