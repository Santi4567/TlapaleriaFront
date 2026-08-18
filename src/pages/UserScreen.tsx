// src/pages/UserScreen.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

// Asegúrate de importar la imagen desde tu carpeta de assets
import fondoPerfil from '../assets/imagen.jpg';

// Interfaces basadas en la respuesta de tu API
interface Permisos {
  [modulo: string]: string[];
}

interface UserProfile {
  id: number;
  username: string;
  name: string;
  rol: string;
  permisos: Permisos;
}

const UserScreen: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.token) {
        setError("No hay token de sesión disponible.");
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile(user.token);
        if (response && response.success) {
          setProfile(response.data);
        } else {
          setError(response?.message || "No se pudo cargar la información del perfil.");
        }
      } catch (err) {
        setError("Error de red al intentar cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.token]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const translateModule = (modulo: string) => {
    const dict: Record<string, string> = {
      'USERS': 'Gestión de Usuarios',
      'PRODUCTS': 'Catálogo de Productos',
      'RESET_PASSWORD': 'Seguridad y Contraseñas',
      'SUPPLIERS': 'Proveedores',
      'PENDINGORDERS': 'Pedidos Pendientes',
      'INVENTORYMOVEMENTS': 'Movimientos de Inventario',
      'RETURNS': 'Devoluciones',
      'SALES': 'Ventas y Mostrador'
    };
    return dict[modulo] || modulo;
  };

  if (loading) {
    return (
      <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl flex items-center justify-center border border-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
          <span className="text-brand-text-muted">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 flex flex-col items-center justify-center border border-gray-800">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-2">Error al cargar perfil</h2>
        <p className="text-brand-text-muted mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col overflow-y-auto">
      
      {/* 1. SECCIÓN: CABECERA DEL PERFIL CON FONDO PERSONALIZADO */}
      <div className="relative rounded-3xl shadow-lg flex flex-col md:flex-row items-center md:items-start md:justify-between mb-8 overflow-hidden border border-gray-700/50 min-h-[220px] p-8">
        
        {/* Imagen de fondo renderizada como cover */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{ backgroundImage: `url(${fondoPerfil})` }}
        ></div>
        
        {/* Capa de degradado oscuro para que la información sea legible */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#161616] via-[#161616]/80 to-transparent"></div>

        {/* Contenido de la cabecera (Avatar y Textos) */}
        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-center space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left w-full h-full">
          
          {/* Avatar */}
          <div className="w-28 h-28 bg-brand-deep-dark rounded-full flex items-center justify-center text-4xl font-black text-brand-orange shadow-2xl border-4 border-brand-orange/30">
            {getInitials(profile.name)}
          </div>
          
          {/* Info del Usuario */}
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">{profile.name}</h1>
            <p className="text-gray-300 text-xl mt-1 drop-shadow-sm">{profile.username}</p>
            <div className="mt-4 flex justify-center md:justify-start">
              <span className="px-5 py-1.5 bg-brand-orange text-brand-deep-dark text-sm font-black uppercase tracking-widest rounded-full shadow-lg">
                Rol: {profile.rol}
              </span>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button 
            onClick={logout}
            className="mt-6 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/30 transition-all shadow-lg backdrop-blur-sm"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* 2. SECCIÓN: PERMISOS DEL USUARIO (Se mantiene igual) */}
      <div>
        <div className="flex items-center space-x-3 mb-6 px-2">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-brand-orange">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <h2 className="text-2xl font-bold text-white">Niveles de Acceso y Permisos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(profile.permisos).map(([modulo, acciones]) => (
            <div key={modulo} className="bg-[#1e1e1e] border border-gray-800 rounded-3xl p-6 shadow-md hover:border-gray-700 transition-colors">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-3">
                {translateModule(modulo)}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {acciones.map((accion, idx) => {
                  const accionPura = accion.split('.')[0];
                  
                  let colorClass = "bg-gray-800 text-gray-300 border-gray-700";
                  if (accionPura === 'add') colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
                  if (accionPura === 'edit') colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  if (accionPura === 'delete') colorClass = "bg-red-500/10 text-red-500 border-red-500/20";

                  return (
                    <span 
                      key={idx} 
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${colorClass}`}
                    >
                      {accion}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default UserScreen;