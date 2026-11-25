import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RocketLogo } from './RocketLogo';
import { FolderGit2, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo de Cohete Minimalista y Marca */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <RocketLogo className="w-4 h-4 sm:w-5 sm:h-5 text-slate-100" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">Ideator</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mt-0.5">
                AI Specification Engine
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              Mis Proyectos
            </Link>
          </nav>
        </div>

        {/* Zona de Usuario y Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200/80">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs ring-1 ring-slate-200">
                  {user.name.trim().charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
