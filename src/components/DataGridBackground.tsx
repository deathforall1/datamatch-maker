import { ReactNode } from 'react';

interface DataGridBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function DataGridBackground({ children, className = '' }: DataGridBackgroundProps) {
  return (
    <div className={`min-h-screen bg-background data-grid-bg ${className}`}>
      {children}
    </div>
  );
}
