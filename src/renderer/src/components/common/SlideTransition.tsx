// src/components/common/SlideTransition.tsx
import React, { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './slide-transitions.css';

type Dir = 1 | -1; // 1 = avanzar (entra por la derecha), -1 = retroceder (entra por la izquierda)

interface SlideTransitionProps {
  viewKey: string | number; // cuando cambia, se dispara la transición
  direction: Dir;
  children: ReactNode;
  className?: string;
}

/**
 * Cambia entre vistas animando la ENTRADA de la nueva y la SALIDA de la anterior.
 * La vista que sale se muestra como una "foto" del último contenido que tenía.
 */
export const SlideTransition: React.FC<SlideTransitionProps> = ({
  viewKey,
  direction,
  children,
  className = '',
}) => {
  const last = useRef({ key: viewKey, node: children });
  const everChanged = useRef(false);
  const [leaving, setLeaving] = useState<{ key: string | number; node: ReactNode; dir: Dir } | null>(null);

  // No animamos en el primer montaje, solo cuando la vista realmente cambia.
  const animate = everChanged.current || last.current.key !== viewKey;

  // Se ejecuta antes de pintar, así que no hay parpadeo entre una vista y otra.
  useLayoutEffect(() => {
    if (last.current.key !== viewKey) {
      everChanged.current = true;
      setLeaving({ key: last.current.key, node: last.current.node, dir: direction });
    }
    last.current = { key: viewKey, node: children };
  });

  return (
    <div className={`relative w-full flex-1 flex flex-col min-h-full ${className}`}>
      <div
        key={viewKey}
        className={`w-full flex-1 flex flex-col min-h-full ${animate ? 'slide-enter' : ''}`}
        style={{ '--slide-from': `${direction * 100}%` } as React.CSSProperties}
      >
        {children}
      </div>

      {leaving && (
        <div
          key={`leaving-${leaving.key}`}
          aria-hidden="true"
          className="slide-leave absolute inset-0 w-full flex flex-col pointer-events-none"
          style={{ '--slide-to': `${-leaving.dir * 100}%` } as React.CSSProperties}
          onAnimationEnd={(e) => {
            // Ignora animaciones de elementos internos que "burbujean" hasta aquí
            if (e.target === e.currentTarget) setLeaving(null);
          }}
        >
          {leaving.node}
        </div>
      )}
    </div>
  );
};

interface SlideOverlayProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Panel que entra por la derecha al abrirse y sale por la derecha al cerrarse.
 * Se mantiene montado durante la animación de salida, con el último contenido
 * que tenía, aunque el padre ya haya limpiado su estado (por ejemplo editingProduct = null).
 */
export const SlideOverlay: React.FC<SlideOverlayProps> = ({ open, children, className = '' }) => {
  const [mounted, setMounted] = useState(open);
  const [settled, setSettled] = useState(false); // true = ya terminó de abrirse
  const [prevOpen, setPrevOpen] = useState(open);
  const snapshot = useRef<ReactNode>(children);

  if (open) snapshot.current = children;
  if (open && !mounted) setMounted(true);
  if (open !== prevOpen) { // al abrir o cerrar, vuelve a "en movimiento"
    setPrevOpen(open);
    setSettled(false);
  }

  // Red de seguridad: si por alguna razón no llega animationend, no dejamos la barra oculta
  useEffect(() => {
    if (!open || settled) return;
    const t = setTimeout(() => setSettled(true), 500);
    return () => clearTimeout(t);
  }, [open, settled]);

  if (!open && !mounted) return null;

  return (
    <div
      data-settled={open && settled ? 'true' : 'false'}
      className={`${className} ${open ? 'overlay-enter' : 'overlay-leave pointer-events-none'}`}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (open) setSettled(true);
        else setMounted(false);
      }}
    >
      {open ? children : snapshot.current}
    </div>
  );
};

export default SlideTransition;