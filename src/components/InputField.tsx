// src/components/InputField.tsx
import React, { InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string[]; // La API devuelve arrays de strings para errores de campo
}

const InputField: React.FC<InputFieldProps> = ({ label, error, ...props }) => {
  return (
    <div className="mb-6">
      {/* Usamos el label estilo la imagen de referencia, encima del borde */}
      <label className="block text-brand-text-muted text-sm mb-1">{label}</label>
      <input 
        className="login-input" 
        {...props} 
      />
      {/* Muestra el primer error de validación si existe */}
      {error && error.length > 0 && (
        <p className="field-error">{error[0]}</p>
      )}
    </div>
  );
};

export default InputField;