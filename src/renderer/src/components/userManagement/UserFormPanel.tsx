// src/components/userManagement/UserFormPanel.tsx
import React, { useState, useEffect } from 'react';
import { Role } from '../../types/rol';
import { User } from '../../types/user';
import UserConfirmModal from './UserConfirmModal';

// 👇 IMPORTA TU IMAGEN AQUÍ (Ajusta la ruta según tu proyecto)
import bgPattern from '../../assets/imagen_3.jpg'; 

interface UserFormPanelProps {
  isOpen: boolean;
  userToEdit: User | null;
  roles: Role[];
  onClose: () => void;
  onSave: (userData: any) => Promise<void>; 
}

const UserFormPanel: React.FC<UserFormPanelProps> = ({ isOpen, userToEdit, roles, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [rolId, setRolId] = useState<string>('');
  
  // Estados para contraseñas
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de interfaz
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //Estado para activar o desactivar a un usuario 
  const [isActive, setIsActive] = useState(false);

  const isEditing = !!userToEdit;

// ==========================================
  // LÓGICA DE VALIDACIÓN DE CONTRASEÑAS
  // ==========================================
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-_]/.test(password); // Signos especiales
  
  const isFormatValid = hasMinLength && hasUpperCase && hasSpecialChar;
  const passwordsMatch = password === confirmPassword;

  // Si edita: válida si está vacía (no la cambia) O si cumple el formato y coinciden.
  // Si crea: válida SOLO si cumple el formato y coinciden.
  const isPasswordValid = isEditing 
    ? (password === '' || (isFormatValid && passwordsMatch)) 
    : (password !== '' && isFormatValid && passwordsMatch);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setName(userToEdit.name);
        setUsername(userToEdit.username);
        setIsActive(userToEdit.isActive ?? false);
        const matchedRole = roles.find(r => r.nombre === userToEdit.rol);
        setRolId(matchedRole ? matchedRole.id.toString() : '');
        setPassword('');
        setConfirmPassword('');
      }else {
        // Limpieza total para un "Nuevo Usuario"
        setName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRolId('');
        setIsActive(false);
      }
      setShowPassword(false);
    }
  }, [isOpen, userToEdit, roles]);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPasswordValid) {
      setIsConfirmOpen(true); 
    }
  };

  const handleFinalSubmit = async () => {
    setIsConfirmOpen(false); 
    setIsSubmitting(true);   

    await onSave({
      id: userToEdit?.id,
      name,
      username,
      password, // Solo mandamos la principal
      rolId: Number(rolId),
      isActive
    });

    setIsSubmitting(false); 
  };

  

  return (
    <>
      <div className="h-full w-full flex flex-col bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* ==========================================
            TOQUE CREATIVO: FONDO TEXTURIZADO
        ========================================== */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen">
          <img src={bgPattern} alt="Background Texture" className="w-full h-full object-cover" />
          {/* Degradado para fundir la imagen con el fondo oscuro y no estorbar el texto */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/40 via-[#121212]/80 to-[#121212]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212]"></div>
        </div>

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-800/80 flex justify-between items-center bg-[#1a1a1a]/70 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-black/50 hover:bg-brand-orange hover:text-black text-gray-400 rounded-xl transition-all border border-gray-700/50">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">
                {isEditing ? 'Configuración de Usuario' : 'Crear Nuevo Usuario'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isEditing ? 'Modifica los datos o permisos de esta cuenta' : 'Ingresa los datos para registrar a un nuevo integrante'}
              </p>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="flex-1 overflow-y-auto p-8 z-10 relative">
          {/* Cambiamos max-w-2xl por max-w-5xl para que quepan las dos columnas */}
          <form onSubmit={handlePreSubmit} className="max-w-5xl mx-auto flex flex-col gap-8 bg-black/40 p-8 rounded-3xl border border-gray-800/50 backdrop-blur-sm shadow-xl">
            
            {/* GRID PRINCIPAL DE 2 COLUMNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* =======================================
                  COLUMNA IZQUIERDA: Datos Generales
              ======================================= */}
              <div className="flex flex-col gap-6">
                <h3 className="text-sm font-bold text-brand-orange uppercase tracking-wider mb-2 border-b border-gray-800/80 pb-3 drop-shadow">
                  Información del Usuario
                </h3>

                {/* Input: Nombre */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-brand-orange transition-colors drop-shadow">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-orange">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </div>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#121212]/80 border border-gray-700 text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all placeholder-gray-600"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                </div>

                {/* Input: Usuario/Correo */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-brand-orange transition-colors drop-shadow">
                    Correo / Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-orange">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    </div>
                    <input type="email" required value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#121212]/80 border border-gray-700 text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all placeholder-gray-600"
                      placeholder="ejemplo@tlapalerialeo.com"
                    />
                  </div>
                </div>

                {/* Input: Rol */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-300 mb-2 group-focus-within:text-brand-orange transition-colors drop-shadow">
                    Rol Asignado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-orange z-10">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                    </div>
                    <select required value={rolId} onChange={(e) => setRolId(e.target.value)}
                      className="w-full bg-[#121212]/80 border border-gray-700 text-white rounded-2xl pl-12 pr-10 py-3 appearance-none focus:outline-none focus:border-brand-orange transition-all cursor-pointer relative"
                    >
                      <option value="" disabled>Selecciona un nivel de acceso</option>
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
                    </div>
                  </div>
                </div>

                {/* NUEVO: SWITCH DE ESTADO (AHORA SÍ DENTRO DE LA COLUMNA IZQUIERDA) */}
                {isEditing && (
                  <div className="group flex items-center justify-between bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 shadow-inner mt-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300">
                        Estado de la Cuenta
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {isActive 
                          ? 'El usuario está ACTIVO y tiene acceso.' 
                          : 'El usuario está INACTIVO (Suspendido).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-[#121212]
                        ${isActive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-700'}
                      `}
                    >
                      <span className="sr-only">Cambiar estado del usuario</span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ease-in-out duration-200
                          ${isActive ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                )}
              </div> {/* <--- AQUÍ CIERRA LA COLUMNA IZQUIERDA */}

              {/* =======================================
                  COLUMNA DERECHA: Seguridad
              ======================================= */}
              <div className="flex flex-col">
                <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800/80 flex flex-col h-full shadow-inner">
                  
                  {/* Header de Seguridad */}
                  <div className="flex justify-between items-center mb-6 border-b border-gray-800/80 pb-3">
                    <h3 className="text-sm font-bold text-brand-orange uppercase tracking-wider drop-shadow">
                      Seguridad de la Cuenta
                    </h3>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-brand-orange transition-colors bg-black/40 px-3 py-1.5 rounded-lg border border-gray-700"
                    >
                      {showPassword ? (
                        <><svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg> Ocultar</>
                      ) : (
                        <><svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Mostrar</>
                      )}
                    </button>
                  </div>

                  {/* Inputs de Contraseña centrados verticalmente */}
                  <div className="flex flex-col gap-6 flex-1 justify-center relative">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Contraseña {isEditing && <span className="text-xs text-brand-orange font-normal">(Opcional al editar)</span>}
                      </label>
                      <input type={showPassword ? "text" : "password"} required={!isEditing} value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-[#121212]/80 border text-white rounded-xl px-4 py-3 focus:outline-none transition-all placeholder-gray-600
                          ${password.length > 0 && !isFormatValid ? 'border-brand-orange/50 focus:border-brand-orange shadow-[0_0_10px_rgba(255,123,51,0.1)]' : 'border-gray-700 focus:border-brand-orange'}`
                        }
                        placeholder={isEditing ? "Dejar en blanco para mantener" : "Ingresa contraseña"}
                      />
                      
                      {password.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5 animate-fade-in">
                          <p className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                            Mínimo 8 caracteres
                          </p>
                          <p className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasUpperCase ? 'text-green-400' : 'text-gray-500'}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                            Al menos una letra mayúscula
                          </p>
                          <p className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasSpecialChar ? 'text-green-400' : 'text-gray-500'}`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                            Al menos un signo o carácter especial
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-400 mb-2">Confirmar Contraseña</label>
                      <input type={showPassword ? "text" : "password"} required={password !== ''} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={password.length > 0 && !isFormatValid}
                        className={`w-full bg-[#121212]/80 border text-white rounded-xl px-4 py-3 focus:outline-none transition-all placeholder-gray-600
                          ${password.length > 0 && !isFormatValid ? 'opacity-50 cursor-not-allowed' : ''}
                          ${password && isFormatValid && !passwordsMatch ? 'border-red-500 focus:border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-700 focus:border-brand-orange'}
                        `}
                        placeholder="Repite la contraseña"
                      />
                      {password && isFormatValid && !passwordsMatch && confirmPassword.length > 0 && (
                        <p className="text-red-400 text-xs mt-2 font-medium flex items-center gap-1 animate-fade-in absolute">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Las contraseñas no coinciden.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =======================================
                BOTONES DE ACCIÓN INFERIORES
            ======================================= */}
            <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-gray-800/80">
              <button type="button" onClick={onClose} disabled={isSubmitting}
                className="w-48 py-3 px-6 bg-black/50 border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <div className="w-64">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isPasswordValid} 
                  className={`group relative w-full flex justify-center items-center font-bold text-base tracking-wide rounded-xl text-white overflow-hidden transition-all active:scale-95
                    ${!isPasswordValid ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-[#ff7b33] to-[#e65100] hover:shadow-[0_0_25px_rgba(255,90,0,0.4)]'}
                  `}
                >
                  {isPasswordValid && (
                    <div className="absolute top-0 -left-[10%] w-[120%] h-full bg-[#0a0a0a] skew-x-[30deg] transition-transform duration-[400ms] ease-[cubic-bezier(0.3,1,0.8,1)] group-hover:translate-x-full group-disabled:translate-x-full z-0"></div>
                  )}
                  <span className="relative z-10 flex items-center py-3 px-5">
                    {isSubmitting ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {isSubmitting ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Completar Registro')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <UserConfirmModal 
        isOpen={isConfirmOpen} 
        isEditing={isEditing} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleFinalSubmit} 
      />
    </>
  );
};

export default UserFormPanel;