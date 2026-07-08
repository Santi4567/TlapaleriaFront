// src/pages/Login.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

import carrusel1 from '../assets/Carrusel_1.jpg';
import carrusel2 from '../assets/Carrusel_2.jpg';

// Definimos los posibles estados visuales antes de hacer login
type AppStatus = 'welcome' | 'verifying' | 'online' | 'error';

const Login: React.FC = () => {
  const { login, isLoading, authError, validationErrors } = useAuth();
  const [usuarioOCorreo, setUsuarioOCorreo] = useState('');
  const [password, setPassword] = useState('');

  // Estados de la interfaz
  const [appStatus, setAppStatus] = useState<AppStatus>('welcome');
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [carrusel1, carrusel2];

  // Efecto del carrusel de fondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Función para comprobar el estado de la API
  const verifyAPI = async () => {
    setIsRetrying(true);
    setAppStatus('verifying');
    
    // Agregamos un mínimo delay estético para que la animación se aprecie
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const isOnline = await authService.checkHealth();
    
    if (isOnline) {
      setAppStatus('online');
    } else {
      setAppStatus('error');
    }
    setIsRetrying(false);
  };

  // Secuencia inicial al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => {
      verifyAPI();
    }, 1500); // 1.5 segundos mostrando "Bienvenido / Cargando"
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ usuarioOCorreo, password });
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-gradient-to-b from-[#ff5a00] via-[#4a0010] to-black">
      
      {/* Contenedor principal con sombra y bordes redondeados */}
      <div className="bg-brand-deep-dark w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex md:flex-row flex-col border border-gray-800">
        
        {/* PANEL IZQUIERDO: Formulario de Login */}
        {/* La magia de la animación está en "max-w-0" pasando a "max-w-[50%]" */}
        <div 
          className={`bg-brand-panel transition-[max-width,opacity] duration-[1200ms] ease-in-out overflow-hidden flex-shrink-0
            ${appStatus === 'online' ? 'max-w-full md:max-w-[50%] opacity-100' : 'max-w-0 opacity-0'}`}
        >
          {/* Un ancho fijo interno garantiza que el texto no se aplaste mientras crece el contenedor padre */}
          <div className="w-full md:w-[512px] p-10 md:p-16 flex flex-col justify-center min-h-[500px] md:min-h-full">
            <h2 className="text-4xl font-bold text-brand-text mb-2">Iniciar Sesión</h2>
            <p className="text-brand-text-muted mb-10">
              Ingresa tus credenciales para acceder al sistema integral de Tlapaleria LEO.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {authError && (
                <div className="bg-brand-error/10 border border-brand-error text-brand-error p-4 rounded-xl text-sm mb-6">
                  {authError}
                </div>
              )}
              <InputField 
                label="Usuario o Correo Electrónico" 
                type="text" 
                placeholder="ej. admin@test.com"
                value={usuarioOCorreo}
                onChange={(e) => setUsuarioOCorreo(e.target.value)}
                error={validationErrors?.UsuarioOCorreo} 
                autoComplete="username"
                required
              />
              <InputField 
                label="Contraseña" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={validationErrors?.Password} 
                autoComplete="current-password"
                required
              />
              <div className="flex items-center justify-between text-sm text-brand-text-muted pt-2 pb-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="accent-brand-orange h-4 w-4 rounded" />
                  <span>Recuérdame</span>
                </label>
                <button type="button" className="text-brand-orange hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-brand-deep-dark font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>
        </div>
        
        {/* PANEL DERECHO: Carrusel y Overlays de Estado */}
        <div className="w-full flex-grow relative min-h-[500px] md:min-h-[600px] overflow-hidden bg-black">
          
          {images.map((img, index) => (
            <img 
              key={index}
              src={img} 
              alt={`Imagen de Tlapaleria ${index + 1}`} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`} 
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          {/* --- BLOQUE CENTRAL (SPLASH SCREEN / HEALTH CHECK) --- */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${appStatus === 'online' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="bg-brand-deep-dark/70 backdrop-blur-md p-10 rounded-2xl border border-gray-700/50 text-center flex flex-col items-center shadow-2xl mx-4 transform transition-all scale-100">
              <h1 className="text-4xl font-extrabold text-brand-orange mb-4">Tlapaleria LEO</h1>
              
              {appStatus === 'welcome' && (
                <div className="flex flex-col items-center animate-pulse">
                  <h2 className="text-2xl text-white font-bold mb-2">Bienvenido</h2>
                  <span className="text-brand-text-muted mt-2 tracking-widest text-sm uppercase">Cargando</span>
                </div>
              )}

              {appStatus === 'verifying' && (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl text-white font-bold mb-4">Bienvenido</h2>
                  <div className="flex items-center space-x-3 text-brand-orange">
                    {/* Spinner minimalista */}
                    <svg className="animate-spin h-5 w-5 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-brand-text font-medium">Verificando conexión...</span>
                  </div>
                </div>
              )}

              {appStatus === 'error' && (
                <div className="flex flex-col items-center">
                  <h2 className="text-3xl text-brand-error font-bold mb-2">¡OPS...!</h2>
                  <p className="text-brand-text-muted mb-8">No se logró conectar con el servidor.</p>
                  <button 
                    onClick={verifyAPI}
                    disabled={isRetrying}
                    className="bg-brand-orange hover:bg-brand-orange-hover text-brand-deep-dark font-bold py-3 px-8 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? 'Reintentando...' : 'Reintentar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- TÍTULO INFERIOR IZQUIERDO (Aparece solo cuando hay conexión) --- */}
          <div className={`absolute bottom-10 left-10 right-10 p-6 bg-brand-deep-dark/60 backdrop-blur-md rounded-xl border border-gray-800 transition-opacity duration-1000 delay-500 ${appStatus === 'online' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <h1 className="text-3xl font-extrabold text-brand-orange">Tlapaleria LEO</h1>
            <p className="text-brand-text font-medium mt-1">Sistema Integral de Punto de Venta e Inventarios</p>
            <div className="flex space-x-2 mt-5">
              {images.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentImageIndex ? 'w-8 bg-brand-orange' : 'w-2 bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;