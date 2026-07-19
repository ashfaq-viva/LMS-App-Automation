const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

function addResult([flowPath, exitCode, startedAt, stoppedAt, outputDir]) {
  const flow = fs.readFileSync(flowPath, 'utf8')
  const name = flow.match(/^name:\s*(.+)$/m)?.[1].trim() || path.basename(flowPath, '.yaml')
  const tags = flow.match(/^tags:\s*\[([^\]]*)\]/m)?.[1]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean) || []
  const relativePath = path.relative(process.cwd(), flowPath)
  const uuid = crypto.randomUUID()
  const passed = Number(exitCode) === 0

  fs.mkdirSync(outputDir, { recursive: true })

  const result = {
    uuid,
    historyId: crypto.createHash('sha256').update(relativePath).digest('hex'),
    testCaseId: crypto.createHash('sha256').update(relativePath).digest('hex'),
    name,
    fullName: relativePath,
    status: passed ? 'passed' : 'failed',
    statusDetails: passed ? {} : { message: `Maestro exited with status ${exitCode}` },
    stage: 'finished',
    start: Number(startedAt),
    stop: Number(stoppedAt),
    labels: [
      { name: 'framework', value: 'maestro' },
      { name: 'language', value: 'yaml' },
      { name: 'suite', value: 'Authentication' },
      ...tags.map((tag) => ({ name: 'tag', value: tag })),
    ],
  }

  fs.writeFileSync(path.join(outputDir, `${uuid}-result.json`), JSON.stringify(result, null, 2))
}

function writeSummary([resultsDir, summaryPath]) {
  let results = []

  if (fs.existsSync(resultsDir)) {
    results = fs.readdirSync(resultsDir)
      .filter((file) => file.endsWith('-result.json'))
      .map((file) => JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8')))
  }

  const passed = results.filter((result) => result.status === 'passed').length
  const failed = results.filter((result) => result.status === 'failed').length
  const lines = [
    '## Maestro authentication results',
    '',
    '| Total | Passed | Failed |',
    '| ---: | ---: | ---: |',
    `| ${results.length} | ${passed} | ${failed} |`,
  ]

  if (failed > 0) {
    lines.push('', '### Failed flows', '', ...results
      .filter((result) => result.status === 'failed')
      .map((result) => `- ${result.name}`))
  }

  fs.appendFileSync(summaryPath, `${lines.join('\n')}\n`)
}

function sanitizeArtifacts([artifactsDir]) {
  const secrets = [process.env.VALID_EMAIL, process.env.VALID_PASSWORD].filter(Boolean)
  const textExtensions = new Set(['.json', '.log', '.txt', '.xml', '.yaml', '.yml'])

  if (!fs.existsSync(artifactsDir) || secrets.length === 0) {
    return
  }

  function sanitizeDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        sanitizeDirectory(entryPath)
      } else if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
        const content = fs.readFileSync(entryPath, 'utf8')
        const sanitized = secrets.reduce(
          (value, secret) => value.split(secret).join('[REDACTED]'),
          content,
        )

        if (sanitized !== content) {
          fs.writeFileSync(entryPath, sanitized)
        }
      }
    }
  }

  sanitizeDirectory(artifactsDir)
}

const [command, ...args] = process.argv.slice(2)

if (command === 'add' && args.length === 5) {
  addResult(args)
} else if (command === 'summary' && args.length === 2) {
  writeSummary(args)
} else if (command === 'sanitize' && args.length === 1) {
  sanitizeArtifacts(args)
} else {
  console.error('Usage: allure-results.js add <flow> <exit-code> <start-ms> <stop-ms> <output-dir>')
  console.error('   or: allure-results.js summary <results-dir> <summary-file>')
  console.error('   or: allure-results.js sanitize <artifacts-dir>')
  process.exit(2)
}
