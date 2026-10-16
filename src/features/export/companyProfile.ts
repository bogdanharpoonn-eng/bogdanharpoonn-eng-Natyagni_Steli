/** Minimal company/surveyor profile for PDF (full settings UI — stage 7). */

export interface CompanyProfile {
  companyName: string
  surveyorName: string
  phone: string
}

const STORAGE_KEY = 'zamir-company-profile'
const DEFAULT_PROFILE: CompanyProfile = {
  companyName: '',
  surveyorName: '',
  phone: '',
}

export function loadCompanyProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROFILE }
    const parsed = JSON.parse(raw) as Partial<CompanyProfile>
    return {
      companyName: parsed.companyName ?? '',
      surveyorName: parsed.surveyorName ?? '',
      phone: parsed.phone ?? '',
    }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
