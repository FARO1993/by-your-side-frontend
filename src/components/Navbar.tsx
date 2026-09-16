import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <Link to="/feed">ByYourSide</Link>
      <span>
        {user?.displayName || user?.username}
        <button onClick={logout}>Cerrar sesión</button>
      </span>
    </nav>
  );
}