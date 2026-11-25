import React from 'react';

interface RocketLogoProps {
  className?: string;
  size?: number;
}

export const RocketLogo: React.FC<RocketLogoProps> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ideator Rocket Logo"
    >
      {/* Cuerpo principal aerodinámico */}
      <path
        d="M12 2.5C12 2.5 16.5 5.5 16.5 12C16.5 15.5 15.2 18 12 21.5C8.8 18 7.5 15.5 7.5 12C7.5 5.5 12 2.5 12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ojo de buey / Núcleo tecnológico */}
      <circle cx="12" cy="8.5" r="1.5" fill="currentColor" />
      {/* Alerón izquierdo */}
      <path
        d="M7.5 13.5L4 16.5V18.5L7.5 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Alerón derecho */}
      <path
        d="M16.5 13.5L20 16.5V18.5L16.5 17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Tobera de propulsión */}
      <path
        d="M10 20.5H14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
};
