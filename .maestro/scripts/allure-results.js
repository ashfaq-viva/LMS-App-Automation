const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

function redactSecrets(content) {
  const redacted = [process.env.VALID_EMAIL, process.env.VALID_PASSWORD]
    .filter(Boolean)
    .reduce((value, secret) => value.split(secret).join('[REDACTED]'), content)

  return redacted.replace(/\u001B(?:[@-_]|\[[0-?]*[ -/]*[@-~])/g, '')
}

function escapeXml(content) {
  return redactSecrets(String(content))
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function writeJunitResult({ flowPath, junitPath, logPath, name, tags, passed, exitCode, startedAt, stoppedAt }) {
  const relativePath = path.relative(process.cwd(), flowPath)
  const duration = Math.max(0, (Number(stoppedAt) - Number(startedAt)) / 1000)
  const log = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : ''
  const properties = tags
    .map((tag) => `        <property name="tag" value="${escapeXml(tag)}"/>`)
    .join('\n')
  const failure = passed
    ? ''
    : `\n      <failure message="Maestro exited with status ${escapeXml(exitCode)}">${escapeXml(log)}</failure>`
  const systemOut = log ? `\n      <system-out>${escapeXml(log)}</system-out>` : ''
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="1" failures="${passed ? 0 : 1}" errors="0" skipped="0" time="${duration}">
  <testsuite name="Authentication" tests="1" failures="${passed ? 0 : 1}" errors="0" skipped="0" time="${duration}">
    <testcase id="${escapeXml(name.split(' ')[0])}" name="${escapeXml(name)}" classname="Authentication" file="${escapeXml(relativePath)}" time="${duration}">
      <properties>
${properties}
      </properties>${failure}${systemOut}
    </testcase>
  </testsuite>
</testsuites>
`

  fs.mkdirSync(path.dirname(junitPath), { recursive: true })
  fs.writeFileSync(junitPath, xml)
}

function addResult([flowPath, exitCode, startedAt, stoppedAt, outputDir, junitPath, logPath, recordingPath, screenshotPath]) {
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

  if (fs.existsSync(logPath)) {
    const log = fs.readFileSync(logPath, 'utf8')
    const sanitizedLog = redactSecrets(log)

    if (sanitizedLog !== log) {
      fs.writeFileSync(logPath, sanitizedLog)
    }
  }

  const attachments = []

  function attach(filePath, name, type) {
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      return
    }

    const source = `${crypto.randomUUID()}-attachment${path.extname(filePath)}`
    const destination = path.join(outputDir, source)

    if (type.startsWith('text/')) {
      fs.writeFileSync(destination, redactSecrets(fs.readFileSync(filePath, 'utf8')))
    } else {
      fs.copyFileSync(filePath, destination)
    }

    attachments.push({ name, source, type })
  }

  attach(recordingPath, 'Screen recording', 'video/mp4')
  attach(screenshotPath, 'Failure screenshot', 'image/png')
  attach(logPath, 'Maestro console output', 'text/plain')

  writeJunitResult({
    flowPath,
    junitPath,
    logPath,
    name,
    tags,
    passed,
    exitCode,
    startedAt,
    stoppedAt,
  })

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
    attachments,
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
  const textExtensions = new Set(['.json', '.log', '.txt', '.xml', '.yaml', '.yml'])

  if (!fs.existsSync(artifactsDir)) {
    return
  }

  function sanitizeDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        sanitizeDirectory(entryPath)
      } else if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
        const content = fs.readFileSync(entryPath, 'utf8')
        const sanitized = redactSecrets(content)

        if (sanitized !== content) {
          fs.writeFileSync(entryPath, sanitized)
        }
      }
    }
  }

  sanitizeDirectory(artifactsDir)
}

const [command, ...args] = process.argv.slice(2)

if (command === 'add' && args.length === 9) {
  addResult(args)
} else if (command === 'summary' && args.length === 2) {
  writeSummary(args)
} else if (command === 'sanitize' && args.length === 1) {
  sanitizeArtifacts(args)
} else {
  console.error('Usage: allure-results.js add <flow> <exit-code> <start-ms> <stop-ms> <output-dir> <junit> <log> <recording> <screenshot>')
  console.error('   or: allure-results.js summary <results-dir> <summary-file>')
  console.error('   or: allure-results.js sanitize <artifacts-dir>')
  process.exit(2)
}
