'use client';

import { useTheme } from '@/components/ThemeProvider';

interface ThemeAwareBackgroundProps {
  darkSrc: string;
  lightSrc: string;
  className?: string;
}

export function ThemeAwareBackground({ darkSrc, lightSrc, className = '' }: ThemeAwareBackgroundProps) {
  const { theme } = useTheme();
  const baseClassName = 'absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-700 ease-in-out';

  return (
    <>
      <div
        aria-hidden="true"
        className={`${baseClassName} ${theme === 'dark' ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{ backgroundImage: `url("${darkSrc}")` }}
      />
      <div
        aria-hidden="true"
        className={`${baseClassName} ${theme === 'light' ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={{ backgroundImage: `url("${lightSrc}")` }}
      />
    </>
  );
}
