import { BrandMark } from "@/components/app/brand-mark"
import { LoginForm } from "@/components/app/login-form"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/hooks/use-session"

/**
 * Session gate for the operator console.
 *
 * On fixtures (`status === "mock"`) the console is always available. Against
 * `tirp-server` the gate blocks the shell until a session is resolved, then
 * shows the sign-in screen when anonymous. The gate holds no conversation
 * content — only the operator identity.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  if (status === "mock" || status === "authenticated") return <>{children}</>

  if (status === "loading") {
    return (
      <main
        className="bg-background flex min-h-dvh items-center justify-center gap-3 px-4"
        aria-busy="true"
      >
        <BrandMark />
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner />
          Restoring your session…
        </span>
      </main>
    )
  }

  return <LoginForm />
}
