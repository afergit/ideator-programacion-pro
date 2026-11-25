import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, GitMerge, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RocketLogo } from '../components/RocketLogo';
import { getApiErrorMessage } from '../lib/api';
import { saveSession } from '../lib/storage';

type FormMode = 'login' | 'register';

interface LocationState {
  from?: { pathname: string };
}

export const Login: React.FC = () => {
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<FormMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const fillDemoCredentials = () => {
    setMode('login');
    setEmail('demo@ideator.com');
    setPassword('Demo1234!');
    setError('');
  };

  const handleDocenteDirectAccess = () => {
    saveSession('docente-demo-token-2026', {
      id: '1',
      name: 'Profesor Evaluador',
      email: 'profesor@evaluacion.edu.pe',
      createdAt: new Date().toISOString(),
    });
    navigate('/project/1');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Isotipo Cohete Minimalista */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white shadow-xs mb-3">
          <RocketLogo className="w-6 h-6 text-slate-100" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Ideator Pro</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Convierte ideas en PRDs estructurados y especificaciones listas para construir.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-5 sm:px-8 shadow-xs border border-slate-200/80 rounded-2xl">
          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ana Pérez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alumno@uai.cl"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <span>
                {isLoading
                  ? 'Procesando...'
                  : mode === 'login'
                    ? 'Ingresar al sistema'
                    : 'Crear cuenta y entrar'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-3.5 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              Usar credenciales demo (demo@ideator.com / Demo1234!)
            </button>
          )}

          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDocenteDirectAccess}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Acceso Rápido Docente (Ver FinPulse AI en Vivo)</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] font-semibold text-slate-600">JWT Seguro</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] font-semibold text-slate-600">Azure OpenAI</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <GitMerge className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[10px] font-semibold text-slate-600">Trazabilidad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
