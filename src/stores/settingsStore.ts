import { create } from 'zustand'
import { DEFAULT_TOLERANCE_MM } from '@/core/geometry'
import type { CompanyProfile } from '@/features/export/companyProfile'

export type ThemeMode = 'dark' | 'light'
export type LengthUnit = 'cm' | 'mm'

export interface AppSettings {
  theme: ThemeMode
  toleranceMm: number
  lengthUnit: LengthUnit
  companyName: string
  surveyorName: string
  phone: string
}

const STORAGE_KEY = 'zamir-settings-v1'

const DEFAULTS: AppSettings = {
  theme: 'dark',
  toleranceMm: DEFAULT_TOLERANCE_MM,
  lengthUnit: 'cm',
  companyName: '',
  surveyorName: '',
  phone: '',
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // migrate old company profile if present
      const legacy = localStorage.getItem('zamir-company-profile')
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<CompanyProfile>
        return {
          ...DEFAULTS,
          companyName: parsed.companyName ?? '',
          surveyorName: parsed.surveyorName ?? '',
          phone: parsed.phone ?? '',
        }
      }
      return { ...DEFAULTS }
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      toleranceMm:
        typeof parsed.toleranceMm === 'number' && parsed.toleranceMm > 0
          ? Math.round(parsed.toleranceMm)
          : DEFAULTS.toleranceMm,
      lengthUnit: parsed.lengthUnit === 'mm' ? 'mm' : 'cm',
      companyName: parsed.companyName ?? '',
      surveyorName: parsed.surveyorName ?? '',
      phone: parsed.phone ?? '',
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function persist(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  // keep legacy key in sync for PDF helpers
  localStorage.setItem(
    'zamir-company-profile',
    JSON.stringify({
      companyName: settings.companyName,
      surveyorName: settings.surveyorName,
      phone: settings.phone,
    }),
  )
}

export function applyThemeToDocument(theme: ThemeMode): void {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(theme)
  root.style.colorScheme = theme
}

interface SettingsState extends AppSettings {
  hydrated: boolean
  hydrate: () => void
  setTheme: (theme: ThemeMode) => void
  setToleranceMm: (mm: number) => void
  setLengthUnit: (unit: LengthUnit) => void
  setCompanyProfile: (profile: CompanyProfile) => void
  toCompanyProfile: () => CompanyProfile
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate() {
    const loaded = loadSettings()
    applyThemeToDocument(loaded.theme)
    set({ ...loaded, hydrated: true })
  },

  setTheme(theme) {
    applyThemeToDocument(theme)
    const next = { ...get(), theme }
    persist(next)
    set({ theme })
  },

  setToleranceMm(mm) {
    const toleranceMm = Math.min(100, Math.max(1, Math.round(mm)))
    const next = { ...get(), toleranceMm }
    persist(next)
    set({ toleranceMm })
  },

  setLengthUnit(lengthUnit) {
    const next = { ...get(), lengthUnit }
    persist(next)
    set({ lengthUnit })
  },

  setCompanyProfile(profile) {
    const next = {
      ...get(),
      companyName: profile.companyName,
      surveyorName: profile.surveyorName,
      phone: profile.phone,
    }
    persist(next)
    set({
      companyName: profile.companyName,
      surveyorName: profile.surveyorName,
      phone: profile.phone,
    })
  },

  toCompanyProfile() {
    const s = get()
    return {
      companyName: s.companyName,
      surveyorName: s.surveyorName,
      phone: s.phone,
    }
  },
}))
