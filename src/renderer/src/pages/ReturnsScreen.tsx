// src/pages/ReturnsScreen.tsx
import React from 'react';
import ReturnsWorkspace from '../components/returns/ReturnsWorkspace';

const ReturnsScreen: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full bg-[#161616] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative overflow-hidden min-h-0">
      <ReturnsWorkspace />
    </div>
  );
};

export default ReturnsScreen;
