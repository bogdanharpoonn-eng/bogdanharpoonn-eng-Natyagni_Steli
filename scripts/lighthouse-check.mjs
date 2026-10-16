/**
 * Prerequisites:
 *   npm run build
 *   npm run preview -- --host 127.0.0.1 --port 4173
 * Then:
 *   npm run lighthouse
 *
 * Note: Lighthouse 12+ removed the built-in PWA category. We still score Performance
 * and smoke-check PWA artifacts (manifest + service worker) in dist/.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const url = process.env.LIGHTHOUSE_URL ?? 'http://127.0.0.1:4173'
const outDir = path.join(root, 'lighthouse-reports')
const distDir = path.join(root, 'dist')
mkdirSync(outDir, { recursive: true })

// Relative path avoids Windows + non-ASCII absolute path issues with Chrome/Lighthouse.
const relativeJson = path.join('lighthouse-reports', 'report.json')

let lighthouseBin
try {
  lighthouseBin = require.resolve('lighthouse/cli/index.js')
} catch {
  lighthouseBin = null
}

const args = [
  url,
  '--only-categories=performance',
  '--form-factor=mobile',
  '--screenEmulation.mobile',
  '--chrome-flags=--headless --no-sandbox',
  '--output=json',
  `--output-path=${relativeJson}`,
  '--quiet',
]

const result = lighthouseBin
  ? spawnSync(process.execPath, [lighthouseBin, ...args], {
      stdio: 'inherit',
      cwd: root,
      env: process.env,
    })
  : spawnSync('npx', ['lighthouse', ...args], {
      stdio: 'inherit',
      cwd: root,
      shell: true,
      env: process.env,
    })

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

function findReportJson() {
  const candidates = [
    path.join(outDir, 'report.json'),
    path.join(outDir, 'report.report.json'),
  ]
  for (const file of candidates) {
    if (existsSync(file)) return file
  }
  if (!existsSync(outDir)) return null
  for (const name of readdirSync(outDir)) {
    if (name.endsWith('.json') && name !== 'summary.json') {
      return path.join(outDir, name)
    }
  }
  return null
}

const reportPath = findReportJson()
if (!reportPath) {
  console.error('Lighthouse finished, but JSON report path was not found. Check lighthouse-reports/.')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const performance = report.categories?.performance?.score ?? 0
const pwaArtifacts = {
  manifest: existsSync(path.join(distDir, 'manifest.webmanifest')),
  serviceWorker: existsSync(path.join(distDir, 'sw.js')),
}
const summary = {
  url,
  performance,
  reportPath: path.relative(root, reportPath).replaceAll('\\', '/'),
  pwaArtifacts,
  ok: performance >= 0.9 && pwaArtifacts.manifest && pwaArtifacts.serviceWorker,
}
writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))

if (!summary.ok) {
  console.error(
    'Thresholds not met: Performance≥0.9 and dist must contain manifest.webmanifest + sw.js',
  )
  process.exit(1)
}
