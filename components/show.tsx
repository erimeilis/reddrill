'use client';

import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';
import { ReactNode } from 'react';

interface ShowProps {
  when: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Show({ when, fallback = null, children }: ShowProps) {
  return when ? <>{children}</> : <>{fallback}</>;
}

export function ShowWhenConnected({ children, fallback }: Omit<ShowProps, 'when'>) {
  const { isConnected } = useMandrillConnection();

  // Simple logic: show children when connected, fallback when not
  return <Show when={isConnected} fallback={fallback}>{children}</Show>;
}

export function ShowWhenDisconnected({ children, fallback }: Omit<ShowProps, 'when'>) {
  const { isConnected } = useMandrillConnection();

  // Simple logic: show children when disconnected, fallback when connected
  return <Show when={!isConnected} fallback={fallback}>{children}</Show>;
}
