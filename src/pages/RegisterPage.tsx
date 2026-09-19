import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { RegisterData, ApiErrorResponse } from '../api/types';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al registrarse');
      } else {
        setError('Error al registrarse');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none disabled:opacity-60';

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input name="username" placeholder="Usuario" onChange={handleChange} required disabled={submitting} className={inputClass} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required disabled={submitting} className={inputClass} />
        <input name="displayName" placeholder="Nombre" onChange={handleChange} disabled={submitting} className={inputClass} />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required disabled={submitting} className={inputClass} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-horizon px-4 py-2.5 font-medium text-white transition-all duration-150 hover:bg-horizon/90 active:scale-95 disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dusk">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-horizon hover:underline">
          Ingresá
        </Link>
      </p>
    </AuthLayout>
  );
}