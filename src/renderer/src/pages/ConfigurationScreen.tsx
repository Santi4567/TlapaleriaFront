// src/pages/ConfigurationScreen.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { configService } from '../services/configService';

const ConfigurationScreen: React.FC = () => {
  const { user } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [rfc, setRfc] = useState('');
  const [postalCode, setPostalCode] = useState('72310');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [facturacionActiva, setFacturacionActiva] = useState(true);
  const [facturapiApiKey, setFacturapiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!user?.token) return;

    const loadConfig = async () => {
      setIsLoading(true);
      const res = await configService.getConfig(user.token);
      setIsLoading(false);

      if (res.success && res.data) {
        setBusinessName(res.data.businessName || '');
        setRfc(res.data.rfc || '');
        setPostalCode(res.data.postalCode || '72310');
        setAddress(res.data.address || '');
        setPhone(res.data.phone || '');
        setEmail(res.data.email || '');
        setFacturacionActiva(res.data.facturacionActiva ?? true);
        setFacturapiApiKey(res.data.facturapiApiKey || '');
      }
    };

    loadConfig();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;

    if (!businessName.trim()) {
      showNotification('❌ El nombre del negocio es obligatorio.');
      return;
    }

    if (!postalCode.trim() || postalCode.trim().length !== 5) {
      showNotification('❌ El código postal debe tener exactamente 5 dígitos.');
      return;
    }

    setIsSaving(true);
    const res = await configService.updateConfig(user.token, {
      businessName: businessName.trim(),
      rfc: rfc.trim().toUpperCase() || undefined,
      postalCode: postalCode.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      facturacionActiva,
      facturapiApiKey: facturapiApiKey.trim() || undefined
    });
    setIsSaving(false);

    if (res.success) {
      showNotification('✅ Configuración guardada correctamente.');
    } else {
      showNotification(`❌ Error al guardar: ${res.message || 'Intente de nuevo.'}`);
    }
  };

  const handleTestConnection = async () => {
    if (!user?.token) return;
    setIsTestingKey(true);
    setTestResult(null);

    const res = await configService.testFacturapi(user.token, facturapiApiKey.trim() || undefined);
    setIsTestingKey(false);

    setTestResult({
      success: res.success,
      message: res.message || (res.success ? 'Conexión verificada con éxito.' : 'Fallo en la conexión.')
    });
  };

  if (user?.rol !== 'Admin') {
    return (
      <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center text-4xl mb-4 border border-red-500/20">
          🔒
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Acceso Restringido</h3>
        <p className="text-sm text-gray-400 max-w-md">
          Esta sección contiene credenciales y datos fiscales del negocio. Solo los usuarios con el rol de <strong className="text-brand-orange">Administrador</strong> tienen autorización para ver o modificar esta configuración.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex items-center justify-center">
        <div className="text-gray-400 font-bold flex items-center gap-3">
          <span className="animate-spin text-2xl">⏳</span>
          <span>Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      
      {/* NOTIFICACIÓN TOAST */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-brand-orange/50 px-6 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-3 text-white font-bold text-sm">
            <span className="text-brand-orange text-lg">ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="mb-6 shrink-0">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="p-2 bg-brand-orange/10 text-brand-orange rounded-2xl border border-brand-orange/20">
            ⚙️
          </span>
          Configuración del Negocio
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Ajusta los datos de la sucursal, lugar de expedición fiscal y la integración de facturación electrónica
        </p>
      </div>

      {/* FORMULARIO CON SCROLL */}
      <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2">
        
        {/* BLOQUE 1: DATOS GENERALES DEL NEGOCIO */}
        <div className="bg-black/40 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2 border-b border-gray-800/80 pb-3">
            <span>🏪</span> Datos de la Ferretería / Sucursal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Nombre Comercial del Negocio *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Tlapalería y Materiales Leo"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">RFC del Negocio (Emisor)</label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="Ej: XIA190128J61"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                Código Postal Fiscal (Lugar de Expedición) *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                placeholder="72310"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Este código postal se usa por ley para el timbrado SAT de ventas a Público en General.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 222-123-4567"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">Dirección Física (Calle, Número, Colonia, Ciudad)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Av. Principal #102, Col. Centro"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">Correo Electrónico de la Tienda</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@tlapalerialeo.com"
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: FACTURACIÓN ELECTRÓNICA (CFDI 4.0 / FACTURAPI) */}
        <div className="bg-black/40 rounded-2xl border border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>🧾</span> Facturación Electrónica (Facturapi)
            </h3>

            {/* SWITCH ACTIVAR / DESACTIVAR */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-bold text-gray-400">
                {facturacionActiva ? 'Facturación Activa ✅' : 'Facturación Desactivada ⏸️'}
              </span>
              <input
                type="checkbox"
                checked={facturacionActiva}
                onChange={(e) => setFacturacionActiva(e.target.checked)}
                className="w-5 h-5 accent-brand-orange rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-400">
                  Secret API Key de Facturapi
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs text-brand-orange hover:underline font-bold"
                >
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <input
                type={showApiKey ? 'text' : 'password'}
                value={facturapiApiKey}
                onChange={(e) => setFacturapiApiKey(e.target.value)}
                placeholder="sk_test_... o sk_live_..."
                className="w-full bg-[#121212] border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Pega tu llave de pruebas (<code className="text-brand-orange">sk_test_...</code>) o tu llave de producción (<code className="text-green-400">sk_live_...</code>) cuando el cliente empiece a timbrar facturas oficiales.
              </span>
            </div>

            {/* BOTÓN PROBAR CONEXIÓN */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingKey}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-colors border border-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isTestingKey ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Probando conexión con Facturapi...</span>
                  </>
                ) : (
                  <>
                    <span>🔌</span>
                    <span>Probar Conexión con Facturapi</span>
                  </>
                )}
              </button>

              {testResult && (
                <span className={`text-xs font-bold flex items-center gap-1 ${
                  testResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {testResult.success ? '✓' : '⚠️'} {testResult.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR TODO */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-brand-orange hover:bg-orange-500 text-brand-deep-dark font-black text-base rounded-2xl transition-all shadow-[0_0_30px_rgba(255,90,0,0.3)] disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default ConfigurationScreen;
