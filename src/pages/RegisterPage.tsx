import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { RegisterData, ApiErrorResponse } from '../api/types';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al registrarse');
      } else {
        setError('Error al registrarse');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear cuenta</h1>
      <input name="username" placeholder="Usuario" onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
      <input name="displayName" placeholder="Nombre" onChange={handleChange} />
      <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Registrarme</button>
      <p>
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
      </p>
    </form>
  );
}