import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatNotifications } from '../context/ChatNotificationsContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import { MenuIcon, CloseIcon } from './Icons';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useChatNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="border-b border-mist bg-paper">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link to="/feed" className="flex items-center gap-2" onClick={closeMenu}>
          <Logo />
          <span className="font-serif text-xl font-semibold text-ink">ByYourSide</span>
        </Link>

        {/* Desktop: todo en una fila */}
        <div className="hidden items-center gap-4 sm:flex">
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
              <span className="text-sm text-dusk hover:text-ink">
                {user.displayName || user.username}
              </span>
            </Link>
          )}
          <button onClick={logout} className="text-sm text-dusk transition-colors hover:text-ink">
            Cerrar sesión
          </button>
        </div>

        {/* Mobile: campanita siempre visible + hamburguesa */}
        <div className="flex items-center gap-3 sm:hidden">
          <NotificationBell />
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Abrir menú"
            className="text-ink transition-transform active:scale-90"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Panel mobile: links apilados */}
      {menuOpen && (
        <div className="flex animate-fade-slide-in flex-col gap-3 border-t border-mist px-4 py-4 sm:hidden">
          {user && (
            <Link to={`/profile/${user.id}`} onClick={closeMenu} className="flex items-center gap-2">
              <Avatar avatarUrl={user.avatarUrl} name={user.displayName || user.username} size="sm" />
              <span className="text-sm font-medium text-ink">
                {user.displayName || user.username}
              </span>
            </Link>
          )}
          <Link to="/help" onClick={closeMenu} className="text-sm font-medium text-calm">
            Ayuda
          </Link>
          <Link to="/discover" onClick={closeMenu} className="text-sm text-dusk">
            Descubrir
          </Link>
          <Link to="/messages" onClick={closeMenu} className="flex items-center gap-2 text-sm text-dusk">
            Mensajes
            {unreadCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-calm text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button onClick={() => { closeMenu(); logout(); }} className="text-left text-sm text-dusk">
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}