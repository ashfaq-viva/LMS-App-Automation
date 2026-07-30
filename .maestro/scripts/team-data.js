const fs = require('node:fs')
const path = require('node:path')

function decodeXml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function save([teamName, outputPath]) {
  const hierarchy = fs.readFileSync(0, 'utf8')
  const values = [...hierarchy.matchAll(/content-desc="([^"]+)"/g)]
    .map((match) => decodeXml(match[1]).trim())
  const teamCode = values.find((value) => /^[A-Z0-9-]{4,15}$/.test(value))

  if (!teamName || !outputPath || !teamCode) {
    console.error('Unable to extract the team code from the current screen.')
    process.exit(1)
  }

  const data = {
    teamName,
    teamCode,
    capturedAt: new Date().toISOString(),
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`)
  process.stdout.write(teamCode)
}

function read([field, inputPath]) {
  if (!field || !inputPath || !fs.existsSync(inputPath)) {
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const value = data[field]

  if (typeof value !== 'string' || value.length === 0) {
    process.exit(1)
  }

  process.stdout.write(value)
}

const [command, ...args] = process.argv.slice(2)

if (command === 'save' && args.length === 2) {
  save(args)
} else if (command === 'read' && args.length === 2) {
  read(args)
} else {
  console.error('Usage: team-data.js save <team-name> <output-file>')
  console.error('   or: team-data.js read <teamName|teamCode> <input-file>')
  process.exit(2)
}
