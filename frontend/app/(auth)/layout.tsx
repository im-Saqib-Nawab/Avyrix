/**
 * Shared layout for authentication routes.
 * Pages own their full-viewport layout (split login/signup, centered forgot-password).
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-base text-primary">{children}</div>;
}
