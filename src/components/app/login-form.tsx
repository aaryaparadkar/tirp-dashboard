import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { BrandMark } from "@/components/app/brand-mark"
import { ErrorState } from "@/components/app/error-state"
import { APP_NAME } from "@/lib/navigation"
import { DashboardApiError } from "@/lib/api/dashboard"
import { loginWithPassword } from "@/lib/api/client"

/**
 * Operator sign-in against `tirp-server`. Errors are shown verbatim from the
 * backend; a bad password never reveals whether the email exists.
 */
export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<DashboardApiError | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (!email.trim() || !password) {
      setError(
        new DashboardApiError({
          code: "validation",
          title: "Check the request",
          message: "Enter both your email address and password.",
        }),
      )
      return
    }
    setPending(true)
    setError(null)
    try {
      await loginWithPassword(email.trim(), password)
    } catch (cause) {
      setError(
        cause instanceof DashboardApiError
          ? cause
          : new DashboardApiError({
              code: "network",
              title: "Could not reach the backend",
              message: "Sign-in failed before reaching tirp-server. Try again.",
            }),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <BrandMark />
            <h1 className="text-xl font-semibold tracking-tight">
              Sign in to {APP_NAME}
            </h1>
            <p className="text-muted-foreground text-sm">
              Use your operator account. The console keeps your session in an
              HTTP-only cookie — no credentials are stored in the browser.
            </p>
          </div>

          {error ? (
            <ErrorState title={error.title} description={error.message} />
          ) : null}

          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="operator-email">Email address</Label>
              <Input
                id="operator-email"
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="operator-password">Password</Label>
              <Input
                id="operator-password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="mt-1">
              {pending ? <Spinner /> : null}
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
