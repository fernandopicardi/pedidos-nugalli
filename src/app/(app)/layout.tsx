
import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  // Header and Footer are now in RootLayout
  // This layout remains for any app-specific structure needed within the (app) group
  return <>{children}</>;
}
