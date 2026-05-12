import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { googleLoginUrl } from '../../lib/api-client';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { Logo } from '../../components/ui/Logo';
import { IconCheck, IconEye, IconEyeOff, IconGoogle } from '../../components/ui/Icons';

interface FormValues {
  displayName: string;
  email: string;
  password: string;
  agree: boolean;
}

export default function RegisterPage() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { displayName: '', email: '', password: '', agree: false },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const password = watch('password');

  const strength = useMemo(() => scorePassword(password ?? ''), [password]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await signUp(values.email, values.password, values.displayName);
      nav('/dashboard');
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? 'Sign up failed. Please try again.');
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        title="Create your account."
        subtitle="Join a workspace after an owner or admin invites you."
      />

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-5 lg:hidden">
          <Logo />
          <Link to="/login" className="text-sm font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="hidden items-center justify-end lg:flex">
              <span className="text-sm text-ink-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                  Sign in
                </Link>
              </span>
            </div>

            <div className="mt-8 lg:mt-16">
              <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
              <p className="mt-2 text-sm text-ink-500">
                Your workspace access starts after an owner or admin assigns you.
              </p>
            </div>

            <a
              href={googleLoginUrl()}
              className="btn-secondary btn-lg mt-8 w-full justify-center"
            >
              <IconGoogle />
              Continue with Google
            </a>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              OR REGISTER WITH EMAIL
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="displayName" className="label">
                  Full name
                </label>
                <input
                  id="displayName"
                  autoComplete="name"
                  placeholder="Jane Cooper"
                  className={`input input-lg ${errors.displayName ? 'input-error' : ''}`}
                  {...register('displayName', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Use at least 2 characters' },
                  })}
                />
                {errors.displayName && <p className="error">{errors.displayName.message}</p>}
              </div>

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
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className={`input input-lg pr-11 ${errors.password ? 'input-error' : ''}`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters' },
                    })}
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
                <PasswordStrength score={strength.score} label={strength.label} />
                {errors.password && <p className="error">{errors.password.message}</p>}
              </div>

              <label className="flex cursor-pointer select-none items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  {...register('agree', { required: 'Please accept the terms' })}
                />
                <span>
                  I agree to the{' '}
                  <Link to="#" className="text-brand-700 hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-brand-700 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.agree && <p className="error">{errors.agree.message}</p>}

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
                    <Spinner /> Creating account…
                  </>
                ) : (
                  <>Create account</>
                )}
              </button>

              <ul className="mt-1 grid grid-cols-2 gap-2 text-xs text-ink-500 sm:grid-cols-3">
                {['No card required', 'Invite based access', 'Role controlled'].map((b) => (
                  <li key={b} className="flex items-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---- helpers ---- */

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 12) s++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];
  return { score: Math.min(s, 5), label: labels[Math.min(s, 5)] };
}

function PasswordStrength({ score, label }: { score: number; label: string }) {
  const colors = [
    'bg-ink-200',
    'bg-rose-500',
    'bg-amber-500',
    'bg-amber-400',
    'bg-emerald-500',
    'bg-emerald-600',
  ];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i < score ? colors[score] : 'bg-ink-200'
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-ink-500">
        Strength: <span className="font-medium text-ink-700">{label}</span>
      </p>
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
