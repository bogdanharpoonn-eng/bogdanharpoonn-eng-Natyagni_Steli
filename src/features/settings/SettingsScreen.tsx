import { useEffect, useState } from 'react'
import { useNavStore } from '@/stores/navStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { OfflineBadge } from '@/components/OfflineBadge'
import { uk } from '@/i18n/uk'

export function SettingsScreen() {
  const goOrders = useNavStore((s) => s.goOrders)
  const theme = useSettingsStore((s) => s.theme)
  const toleranceMm = useSettingsStore((s) => s.toleranceMm)
  const lengthUnit = useSettingsStore((s) => s.lengthUnit)
  const companyName = useSettingsStore((s) => s.companyName)
  const surveyorName = useSettingsStore((s) => s.surveyorName)
  const phone = useSettingsStore((s) => s.phone)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setToleranceMm = useSettingsStore((s) => s.setToleranceMm)
  const setLengthUnit = useSettingsStore((s) => s.setLengthUnit)
  const setCompanyProfile = useSettingsStore((s) => s.setCompanyProfile)

  const [tolDraft, setTolDraft] = useState(String(toleranceMm))
  const [companyDraft, setCompanyDraft] = useState(companyName)
  const [surveyorDraft, setSurveyorDraft] = useState(surveyorName)
  const [phoneDraft, setPhoneDraft] = useState(phone)
  const [saved, setSaved] = useState(false)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    setTolDraft(String(toleranceMm))
  }, [toleranceMm])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const saveProfile = () => {
    setCompanyProfile({
      companyName: companyDraft,
      surveyorName: surveyorDraft,
      phone: phoneDraft,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="theme-page min-h-dvh">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3 py-4 pb-10">
        <header className="flex items-center gap-2">
          <button
            type="button"
            onClick={goOrders}
            className="theme-btn-ghost min-h-touch min-w-touch rounded-md px-2"
          >
            {uk.commonBack}
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{uk.settingsTitle}</h1>
          </div>
          <OfflineBadge online={online} />
        </header>

        <section className="theme-card space-y-3 rounded-lg p-3">
          <h2 className="text-sm font-semibold">{uk.settingsTheme}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`min-h-touch rounded-md text-sm ring-1 ${theme === 'dark' ? 'theme-btn-primary' : 'theme-btn-ghost'}`}
              onClick={() => setTheme('dark')}
            >
              {uk.settingsThemeDark}
            </button>
            <button
              type="button"
              className={`min-h-touch rounded-md text-sm ring-1 ${theme === 'light' ? 'theme-btn-primary' : 'theme-btn-ghost'}`}
              onClick={() => setTheme('light')}
            >
              {uk.settingsThemeLight}
            </button>
          </div>
        </section>

        <section className="theme-card space-y-3 rounded-lg p-3">
          <h2 className="text-sm font-semibold">{uk.settingsUnits}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`min-h-touch rounded-md text-sm ring-1 ${lengthUnit === 'cm' ? 'theme-btn-primary' : 'theme-btn-ghost'}`}
              onClick={() => setLengthUnit('cm')}
            >
              {uk.settingsUnitCm}
            </button>
            <button
              type="button"
              className={`min-h-touch rounded-md text-sm ring-1 ${lengthUnit === 'mm' ? 'theme-btn-primary' : 'theme-btn-ghost'}`}
              onClick={() => setLengthUnit('mm')}
            >
              {uk.settingsUnitMm}
            </button>
          </div>
        </section>

        <section className="theme-card space-y-3 rounded-lg p-3">
          <h2 className="text-sm font-semibold">{uk.settingsTolerance}</h2>
          <p className="text-sm theme-muted">{uk.settingsToleranceHint}</p>
          <label className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              className="theme-input min-h-touch w-28 rounded-md px-3"
              value={tolDraft}
              onChange={(e) => setTolDraft(e.target.value)}
              onBlur={() => setToleranceMm(Number(tolDraft) || 10)}
            />
            <span className="text-sm">{uk.unitMm}</span>
          </label>
        </section>

        <section className="theme-card space-y-2 rounded-lg p-3">
          <h2 className="text-sm font-semibold">{uk.settingsCompany}</h2>
          <input
            className="theme-input min-h-touch w-full rounded-md px-3"
            placeholder={uk.pdfCompany}
            value={companyDraft}
            onChange={(e) => setCompanyDraft(e.target.value)}
          />
          <input
            className="theme-input min-h-touch w-full rounded-md px-3"
            placeholder={uk.pdfSurveyor}
            value={surveyorDraft}
            onChange={(e) => setSurveyorDraft(e.target.value)}
          />
          <input
            className="theme-input min-h-touch w-full rounded-md px-3"
            placeholder={uk.pdfPhone}
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
          />
          <button type="button" className="theme-btn-primary min-h-touch w-full rounded-md text-sm" onClick={saveProfile}>
            {uk.commonSave}
          </button>
          {saved ? <p className="text-sm text-sky-600 dark:text-sky-300">{uk.settingsSaved}</p> : null}
        </section>

        <section className="theme-card space-y-2 rounded-lg p-3">
          <h2 className="text-sm font-semibold">{uk.settingsOffline}</h2>
          <p className="text-sm theme-muted">
            {online ? uk.settingsOfflineOnline : uk.settingsOfflineOffline}
          </p>
          <p className="text-sm theme-muted">{uk.settingsOfflineHint}</p>
        </section>
      </div>
    </div>
  )
}
