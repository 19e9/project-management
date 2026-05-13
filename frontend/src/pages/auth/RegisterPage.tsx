import { Navigate, Link, useNavigate } from 'react-router-dom';
import { APP_HOME_PATH } from '../../features/auth/authPaths';
import { useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { googleLoginUrl, tokens } from '../../lib/api-client';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { Logo } from '../../components/ui/Logo';
import { IconCheck, IconEye, IconEyeOff, IconGoogle } from '../../components/ui/Icons';
import type { TFunction } from '../../i18n/I18nProvider';
import { useT } from '../../i18n/I18nProvider';

interface FormValues {
  displayName: string;
  email: string;
  password: string;
  agree: boolean;
}

const STRENGTH_KEYS = ['auth.pwTooShort', 'auth.pwWeak', 'auth.pwFair', 'auth.pwGood', 'auth.pwStrong'] as const;

export default function RegisterPage() {
  const t = useT();
  const { signUp, user, loading } = useAuth();
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

  const strengthScore = useMemo(() => scorePassword(password ?? ''), [password]);

  const bulletKeys = ['auth.bulletNoCard', 'auth.bulletInvite', 'auth.bulletRole'] as const;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await signUp(values.email, values.password, values.displayName);
      nav(APP_HOME_PATH);
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? t('auth.signUpFailed'));
    }
  }

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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel title={t('auth.registerBrandTitle')} subtitle={t('auth.registerBrandSubtitle')} />

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-ink-200/60 px-6 py-5 lg:hidden">
          <Logo />
          <Link to="/login" className="text-sm font-medium text-brand-700 hover:underline">
            {t('auth.signInShort')}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="hidden items-center justify-end lg:flex">
              <span className="text-sm text-ink-500">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                  {t('auth.signInShort')}
                </Link>
              </span>
            </div>

            <div className="mt-8 lg:mt-16">
              <h1 className="text-3xl font-bold tracking-tight">{t('auth.registerHeading')}</h1>
              <p className="mt-2 text-sm text-ink-500">{t('auth.registerSubtitle')}</p>
            </div>

            <a href={googleLoginUrl()} className="btn-secondary btn-lg mt-8 w-full justify-center">
              <IconGoogle />
              {t('auth.googleContinue')}
            </a>

            <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              {t('auth.dividerRegister')}
              <span className="h-px flex-1 bg-ink-200" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="displayName" className="label">
                  {t('auth.fullName')}
                </label>
                <input
                  id="displayName"
                  autoComplete="name"
                  placeholder={t('auth.placeholderDisplayName')}
                  className={`input input-lg ${errors.displayName ? 'input-error' : ''}`}
                  {...register('displayName', {
                    required: t('auth.errNameReq'),
                    minLength: { value: 2, message: t('auth.errNameMin') },
                  })}
                />
                {errors.displayName && <p className="error">{errors.displayName.message}</p>}
              </div>

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
                <label htmlFor="password" className="label">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.passMinLen')}
                    className={`input input-lg pr-11 ${errors.password ? 'input-error' : ''}`}
                    {...register('password', {
                      required: t('auth.errPassReq'),
                      minLength: { value: 8, message: t('auth.errPassMinChars') },
                    })}
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
                <PasswordStrength score={strengthScore} t={t} />
                {errors.password && <p className="error">{errors.password.message}</p>}
              </div>

              <label className="flex cursor-pointer select-none items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  {...register('agree', { required: t('auth.errTerms') })}
                />
                <span>
                  {t('auth.agreePrefix')}{' '}
                  <Link to="#" className="text-brand-700 hover:underline">
                    {t('auth.terms')}
                  </Link>{' '}
                  {t('auth.agreeAnd')}{' '}
                  <Link to="#" className="text-brand-700 hover:underline">
                    {t('auth.privacyPolicy')}
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

              <button type="submit" disabled={isSubmitting || !isValid} className="btn-brand btn-lg w-full justify-center">
                {isSubmitting ? (
                  <>
                    <Spinner /> {t('auth.creatingAccount')}
                  </>
                ) : (
                  t('auth.submitRegister')
                )}
              </button>

              <ul className="mt-1 grid grid-cols-2 gap-2 text-xs text-ink-500 sm:grid-cols-3">
                {bulletKeys.map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {t(k)}
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

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 12) s++;
  return Math.min(s, 5);
}

function PasswordStrength({ score, t }: { score: number; t: TFunction }) {
  const colors = [
    'bg-ink-200',
    'bg-rose-500',
    'bg-amber-500',
    'bg-amber-400',
    'bg-emerald-500',
    'bg-emerald-600',
  ];
  const label = t(STRENGTH_KEYS[Math.min(Math.max(score, 0), STRENGTH_KEYS.length - 1)]);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition ${i < score ? colors[score] : 'bg-ink-200'}`} />
        ))}
      </div>
      <p className="text-[11px] text-ink-500">
        {t('auth.strengthPrefix')} <span className="font-medium text-ink-700">{label}</span>
      </p>
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
