import { Navigate, Link, useNavigate } from 'react-router-dom';
import { APP_HOME_PATH } from '../../features/auth/authPaths';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { googleLoginUrl, tokens } from '../../lib/api-client';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { Logo } from '../../components/ui/Logo';
import { IconEye, IconEyeOff, IconGoogle } from '../../components/ui/Icons';
import { useT } from '../../i18n/I18nProvider';

interface FormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const t = useT();
  const { signIn, user, loading } = useAuth();
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

  if (user) return <Navigate to={APP_HOME_PATH} replace />;

  if (loading && tokens.getAccess()) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-500">
        <span className="inline-flex items-center gap-2 text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {t('common.loading')}
        </span>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await signIn(values.email, values.password);
      nav(APP_HOME_PATH);
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? t('auth.signInFailed'));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel title={t('auth.loginBrandTitle')} subtitle={t('auth.loginBrandSubtitle')} />

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-5 lg:hidden">
          <Logo />
          <Link to="/register" className="text-sm font-medium text-brand-700 hover:underline">
            {t('auth.createAccount')}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="hidden items-center justify-end lg:flex">
              <span className="text-sm text-ink-500">
                {t('auth.newToApp')}{' '}
                <Link to="/register" className="font-medium text-brand-700 hover:underline">
                  {t('auth.createAccountLink')}
                </Link>
              </span>
            </div>

            <div className="mt-8 lg:mt-16">
              <h1 className="text-3xl font-bold tracking-tight">{t('auth.signInHeading')}</h1>
              <p className="mt-2 text-sm text-ink-500">{t('auth.signInSubtitle')}</p>
            </div>

            <a href={googleLoginUrl()} className="btn-secondary btn-lg mt-8 w-full justify-center">
              <IconGoogle />
              {t('auth.googleContinue')}
            </a>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              {t('auth.dividerEmailLogin')}
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="email" className="label">
                  {t('auth.workEmail')}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  className={`input input-lg ${errors.email ? 'input-error' : ''}`}
                  {...register('email', {
                    required: t('auth.errEmailReq'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('auth.errEmailInvalid'),
                    },
                  })}
                />
                {errors.email && <p className="error">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label mb-0">
                    {t('auth.password')}
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.placeholderPasswordDots')}
                    className={`input input-lg pr-11 ${errors.password ? 'input-error' : ''}`}
                    {...register('password', { required: t('auth.errPassReq') })}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
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
                {t('auth.keepSignedIn')}
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

              <button type="submit" disabled={isSubmitting || !isValid} className="btn-brand btn-lg w-full justify-center">
                {isSubmitting ? (
                  <>
                    <Spinner /> {t('auth.signingIn')}
                  </>
                ) : (
                  t('auth.submitSignIn')
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-ink-500 lg:hidden">
              {t('auth.noAccountMobile')}{' '}
              <Link to="/register" className="font-medium text-brand-700 hover:underline">
                {t('auth.createOne')}
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
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
