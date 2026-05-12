import { localeOptions, useI18n, type Locale } from '../../i18n/I18nProvider';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const active = localeOptions.find((option) => option.code === locale);

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white text-ink-700 shadow-soft ${
        compact ? 'h-9 px-2 text-xs' : 'h-10 px-3 text-sm'
      }`}
      title="Language"
    >
      <span className="font-semibold">{active?.shortLabel ?? locale.toUpperCase()}</span>
      <select
        aria-label="Language"
        className="bg-transparent text-inherit outline-none"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {localeOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
