import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Hola, {user?.displayName || user?.username} 👋</h1>
      <p>Acá va el feed — lo armamos en el próximo paso.</p>
    </div>
  );
}