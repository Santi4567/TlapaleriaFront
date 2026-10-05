// src/pages/Login.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import InputField from '../components/InputField';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

import carrusel1 from '../assets/Carrusel_1.jpg';
import carrusel2 from '../assets/Carrusel_2.jpg';
import logo from '../assets/logo.png'; 

type AppStatus = 'welcome' | 'verifying' | 'online' | 'error';

const Login: React.FC = () => {
  const { login, isLoading, authError, validationErrors } = useAuth();
  const [usuarioOCorreo, setUsuarioOCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const [appStatus, setAppStatus] = useState<AppStatus>('welcome');
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = [carrusel1, carrusel2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const verifyAPI = async () => {
    setIsRetrying(true);
    setAppStatus('verifying');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const isOnline = await authService.checkHealth();
    
    if (isOnline) {
      setAppStatus('online');
    } else {
      setAppStatus('error');
    }
    setIsRetrying(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      verifyAPI();
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ usuarioOCorreo, password });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-gradient-to-b from-[#ff5a00] via-[#4a0010] to-black">
      
      <div className="bg-brand-deep-dark w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex md:flex-row flex-col border border-gray-800">
        
        {/* PANEL IZQUIERDO: Formulario de Login */}
        <div 
          className={`bg-brand-panel transition-[max-width,opacity] duration-[1200ms] ease-in-out overflow-hidden flex-shrink-0
            ${appStatus === 'online' ? 'max-w-full md:max-w-[50%] opacity-100' : 'max-w-0 opacity-0'}`}
        >
          <div className="w-full md:w-[512px] p-10 md:p-16 flex flex-col justify-center min-h-[500px] md:min-h-full">
            
            <img 
              src={logo} 
              alt="Logo Tlapaleria LEO" 
              className="w-20 h-20 object-contain mb-6 drop-shadow-lg" 
            />
            
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
              
              <div className="relative flex flex-col">
                <InputField 
                  label="Contraseña" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={validationErrors?.Password} 
                  autoComplete="current-password"
                  required
                />
                
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2 bottom-[34px] text-gray-400 hover:text-brand-orange transition-colors focus:outline-none"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* === NUEVO BOTÓN ANIMADO VERSIÓN TAILWIND === */}
              <button 
                type="submit" 
                disabled={isLoading}
                className={`group relative flex items-center justify-center w-full mt-8 px-9 py-4 border-4 border-transparent bg-transparent rounded-full font-extrabold text-brand-orange shadow-[0_0_0_2px_#ff5a00] cursor-pointer overflow-hidden transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 disabled:cursor-not-allowed ${!isLoading && 'hover:shadow-[0_0_0_12px_transparent] hover:rounded-2xl hover:text-brand-deep-dark active:scale-95 active:shadow-[0_0_0_4px_#ff5a00]'}`}
              >
                {/* Flecha Izquierda (Entra al hacer hover) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute w-6 fill-brand-deep-dark z-10 -left-1/4 group-hover:left-4 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]" viewBox="0 0 24 24">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                </svg>
                
                {/* Texto del Botón */}
                <span className="relative z-10 -translate-x-3 group-hover:translate-x-3 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] tracking-widest uppercase">
                  {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                </span>
                
                {/* Círculo expansivo de fondo */}
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-brand-orange rounded-full opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:w-[800px] group-hover:h-[800px] group-hover:opacity-100 z-0" />
                
                {/* Flecha Derecha (Sale al hacer hover) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute w-6 fill-brand-orange z-10 right-4 group-hover:-right-1/4 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:fill-brand-deep-dark" viewBox="0 0 24 24">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
                </svg>
              </button>
              {/* ============================================== */}

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