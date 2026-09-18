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

  const inputClass =
    'rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none';

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center font-serif text-3xl font-semibold text-ink">
          Crear cuenta
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="username" placeholder="Usuario" onChange={handleChange} required className={inputClass} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className={inputClass} />
          <input name="displayName" placeholder="Nombre" onChange={handleChange} className={inputClass} />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required className={inputClass} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-md bg-horizon px-4 py-2.5 font-medium text-white transition-colors hover:bg-horizon/90"
          >
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dusk">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-horizon hover:underline">
            Ingresá
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-dusk">
          <Link to="/help" className="font-medium text-calm hover:underline">
            ¿Necesitás ayuda ahora?
          </Link>
        </p>
      </div>
    </div>
  );
}