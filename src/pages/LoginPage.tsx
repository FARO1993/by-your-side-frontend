import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../api/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al iniciar sesión');
      } else {
        setError('Error al iniciar sesión');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>ByYourSide</h1>
      <input
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Ingresar</button>
      <p>
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </form>
  );
}