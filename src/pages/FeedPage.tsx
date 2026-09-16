import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Hola, {user?.displayName || user?.username} 👋</h1>
      <button onClick={logout}>Cerrar sesión</button>
      <p>Acá va el feed — lo armamos en el próximo paso.</p>
    </div>
  );
}