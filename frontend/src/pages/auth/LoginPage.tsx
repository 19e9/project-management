import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { googleLoginUrl } from '../../lib/api-client';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { Logo } from '../../components/ui/Logo';
import { IconEye, IconEyeOff, IconGoogle } from '../../components/ui/Icons';

interface FormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: { email: '', password: '', remember: true },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await signIn(values.email, values.password);
      nav('/dashboard');
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? 'Sign in failed. Please try again.');
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        title="Welcome back."
        subtitle="Pick up where you left off — your plan, your team, your timeline."
      />

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-5 lg:hidden">
          <Logo />
          <Link to="/register" className="text-sm font-medium text-brand-700 hover:underline">
            Create account
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="hidden items-center justify-end lg:flex">
              <span className="text-sm text-ink-500">
                New to PlanForge?{' '}
                <Link to="/register" className="font-medium text-brand-700 hover:underline">
                  Create an account
                </Link>
              </span>
            </div>

            <div className="mt-8 lg:mt-16">
              <h1 className="text-3xl font-bold tracking-tight">Sign in to PlanForge</h1>
              <p className="mt-2 text-sm text-ink-500">
                Use your email and password, or continue with Google.
              </p>
            </div>

            {/* OAuth */}
            <a
              href={googleLoginUrl()}
              className="btn-secondary btn-lg mt-8 w-full justify-center"
            >
              <IconGoogle />
              Continue with Google
            </a>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              OR CONTINUE WITH EMAIL
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="email" className="label">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`input input-lg ${errors.email ? 'input-error' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email',
                    },
                  })}
                />
                {errors.email && <p className="error">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label mb-0">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`input input-lg pr-11 ${errors.password ? 'input-error' : ''}`}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
                  >
                    {showPw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="error">{errors.password.message}</p>}
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  {...register('remember')}
                />
                Keep me signed in for 30 days
              </label>

              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-danger-500/30 bg-danger-500/5 p-3 text-sm text-danger-600"
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
                  </svg>
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="btn-brand btn-lg w-full justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Spinner /> Signing in…
                  </>
                ) : (
                  <>Sign in</>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-ink-500 lg:hidden">
              No account?{' '}
              <Link to="/register" className="font-medium text-brand-700 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
