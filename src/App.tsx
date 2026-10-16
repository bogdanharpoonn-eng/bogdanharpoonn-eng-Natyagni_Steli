import { uk } from '@/i18n/uk'

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">{uk.appTitle}</h1>
        <p className="mt-3 text-base text-slate-300">{uk.appTagline}</p>
        <p className="mt-8 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400">
          {uk.stage1Placeholder}
        </p>
      </main>
    </div>
  )
}
