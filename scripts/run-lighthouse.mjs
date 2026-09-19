import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'
import path from 'node:path'

const root = process.cwd()
const reportDir = path.join(root, 'reports', 'lighthouse')
const baseUrl = 'http://127.0.0.1:4173'
const runsPerTarget = 3

const targets = [
  { id: 'inicio-mobile', url: '/', profile: 'mobile' },
  { id: 'inicio-desktop', url: '/', profile: 'desktop' },
  { id: 'detalhe-mobile', url: '/nft/emerald-ape-042', profile: 'mobile' },
  { id: 'detalhe-desktop', url: '/nft/emerald-ape-042', profile: 'desktop' },
]

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...options.env },
      stdio: options.stdio ?? 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await wait(500)
  }
  throw new Error(`Preview server did not start at ${baseUrl}`)
}

async function listJsonReports() {
  const entries = await readdir(reportDir)
  return entries.filter((entry) => entry.endsWith('.json')).sort()
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function writeSummary() {
  const files = await listJsonReports()
  const grouped = new Map()

  for (const file of files) {
    const report = JSON.parse(await readFile(path.join(reportDir, file), 'utf8'))
    const key = file.replace(/-run-\d+.*\.json$/, '')
    const item = {
      file,
      categories: {
        performance: Math.round(report.categories.performance.score * 100),
        accessibility: Math.round(report.categories.accessibility.score * 100),
        bestPractices: Math.round(report.categories['best-practices'].score * 100),
        seo: Math.round(report.categories.seo.score * 100),
      },
      metrics: {
        lcpMs: report.audits['largest-contentful-paint']?.numericValue ?? null,
        cls: report.audits['cumulative-layout-shift']?.numericValue ?? null,
        tbtMs: report.audits['total-blocking-time']?.numericValue ?? null,
      },
      environment: {
        lighthouseVersion: report.lighthouseVersion,
        userAgent: report.userAgent,
        fetchTime: report.fetchTime,
      },
    }
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    runsPerTarget,
    targets: Object.fromEntries(
      [...grouped.entries()].map(([key, items]) => [
        key,
        {
          runs: items,
          median: {
            performance: median(items.map((item) => item.categories.performance)),
            accessibility: median(items.map((item) => item.categories.accessibility)),
            bestPractices: median(items.map((item) => item.categories.bestPractices)),
            seo: median(items.map((item) => item.categories.seo)),
            lcpMs: median(items.map((item) => item.metrics.lcpMs).filter(Number.isFinite)),
            cls: median(items.map((item) => item.metrics.cls).filter(Number.isFinite)),
            tbtMs: median(items.map((item) => item.metrics.tbtMs).filter(Number.isFinite)),
          },
        },
      ]),
    ),
  }

  await writeFile(path.join(reportDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

await mkdir(reportDir, { recursive: true })

console.log('Building production bundle with MSW enabled...')
await run('npm', ['run', 'build'], { env: { VITE_ENABLE_MSW: 'true' } })

console.log('Starting Vite preview...')
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: root,
  env: { ...process.env, VITE_ENABLE_MSW: 'true' },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

try {
  await waitForServer()

  for (const target of targets) {
    for (let runIndex = 1; runIndex <= runsPerTarget; runIndex += 1) {
      const outputPath = path.join(reportDir, `${target.id}-run-${runIndex}`)
      const args = [
        `${baseUrl}${target.url}`,
        '--output=html',
        '--output=json',
        `--output-path=${outputPath}`,
        '--chrome-flags=--headless=new --no-sandbox',
        '--quiet',
      ]
      if (target.profile === 'desktop') args.push('--preset=desktop')

      console.log(`Running Lighthouse: ${target.id} (${runIndex}/${runsPerTarget})`)
      await run('npx', ['lighthouse', ...args])
    }
  }

  await writeSummary()
  console.log(`Lighthouse reports written to ${path.relative(root, reportDir)}`)
} finally {
  preview.kill('SIGTERM')
}
