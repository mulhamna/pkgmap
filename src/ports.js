import ora from 'ora'
import chalk from 'chalk'
import { execSync } from 'child_process'

import { renderBanner } from './display/table.js'
import { renderPorts } from './display/ports.js'
import { isAvailable } from './utils.js'

function parsePsRow(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d+)\s+(.+?)\s+(.+)$/)
  if (!match) return null

  return {
    ppid: Number(match[1]),
    stat: match[2],
    command: match[3].trim(),
  }
}

export function inspectPid(pid, platform = process.platform) {
  if (!pid) return { healthStatus: 'orphan', reason: 'missing pid' }

  if (platform === 'win32') {
    try {
      const raw = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 10000,
      }).toString().trim()

      if (!raw || raw.startsWith('INFO:')) {
        return { healthStatus: 'orphan', reason: 'pid not found' }
      }

      return { healthStatus: 'ok', reason: 'process found' }
    } catch {
      return { healthStatus: 'orphan', reason: 'pid lookup failed' }
    }
  }

  try {
    const raw = execSync(`ps -o ppid=,stat=,comm= -p ${pid}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const row = parsePsRow(raw)
    if (!row) return { healthStatus: 'orphan', reason: 'pid not found' }
    if (row.stat.includes('Z')) return { healthStatus: 'zombie', reason: 'zombie process', meta: row }

    return { healthStatus: 'ok', reason: 'process found', meta: row }
  } catch {
    return { healthStatus: 'orphan', reason: 'pid lookup failed' }
  }
}

export function annotatePorts(ports, pidInspector = inspectPid) {
  return ports.map((entry) => {
    const fallbackStatus = !entry.pid || entry.process === 'unknown' ? 'orphan' : 'ok'
    const inspection = entry.pid ? pidInspector(entry.pid) : null
    const healthStatus = inspection?.healthStatus || fallbackStatus

    return {
      ...entry,
      healthStatus,
      healthReason: inspection?.reason || (fallbackStatus === 'orphan' ? 'missing owner metadata' : 'process found'),
      processCommand: inspection?.meta?.command || entry.process,
    }
  })
}

export function filterSuspiciousPorts(ports) {
  return ports.filter((entry) => entry.healthStatus === 'orphan' || entry.healthStatus === 'zombie')
}

export function terminatePorts(ports, { signal = 'SIGTERM' } = {}) {
  const targets = [...new Set(ports.map((entry) => entry.pid).filter(Boolean))]

  if (targets.length === 0) {
    return { killed: [], skipped: ports }
  }

  for (const pid of targets) {
    process.kill(pid, signal)
  }

  return {
    killed: targets,
    skipped: ports.filter((entry) => !entry.pid),
  }
}

function splitAddressPort(value) {
  const normalized = value.trim()

  if (normalized.startsWith('[')) {
    const match = normalized.match(/^\[([^\]]+)\]:(\d+)$/)
    if (match) return { address: match[1], port: Number(match[2]) }
  }

  const lastColon = normalized.lastIndexOf(':')
  if (lastColon === -1) return { address: normalized, port: null }

  const address = normalized.slice(0, lastColon)
  const port = Number(normalized.slice(lastColon + 1))
  return { address, port: Number.isNaN(port) ? null : port }
}

function parseLinuxPorts(raw) {
  const seen = new Set()

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/)
      if (parts.length < 5) return null

      const state = (parts[0] || 'listen').toUpperCase()
      const local = splitAddressPort(parts[3] || '')
      const processMatch = line.match(/users:\(\((?:"?)([^",]+)(?:"?),pid=(\d+)/)

      if (!local.port) return null

      const entry = {
        port: local.port,
        protocol: 'tcp',
        address: local.address || '*',
        process: processMatch?.[1] || 'unknown',
        pid: processMatch?.[2] ? Number(processMatch[2]) : null,
        state,
      }

      const key = `${entry.protocol}:${entry.port}:${entry.pid || entry.process}`
      if (seen.has(key)) return null
      seen.add(key)

      return entry
    })
    .filter(Boolean)
    .sort((a, b) => a.port - b.port || a.process.localeCompare(b.process))
}

function parseMacPorts(raw) {
  const seen = new Set()

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/)
      if (parts.length < 9) return null

      const command = parts[0]
      const pid = Number(parts[1])
      const protocol = (parts[7] || 'tcp').toLowerCase()
      const name = parts.slice(8).join(' ')
      const match =
        name.match(/(.+)->/) || name.match(/(.+)\(LISTEN\)/) || name.match(/(.+)\(LISTEN\)$/)
      const endpoint = (match?.[1] || name).trim()
      const local = splitAddressPort(endpoint)

      if (!local.port) return null

      const entry = {
        port: local.port,
        protocol,
        address: local.address || '*',
        process: command || 'unknown',
        pid: Number.isNaN(pid) ? null : pid,
        state: 'LISTEN',
      }

      const key = `${entry.protocol}:${entry.port}:${entry.pid || entry.process}`
      if (seen.has(key)) return null
      seen.add(key)

      return entry
    })
    .filter(Boolean)
    .sort((a, b) => a.port - b.port || a.process.localeCompare(b.process))
}

function parseWindowsPorts(raw, tasksRaw) {
  const pidMap = new Map(
    tasksRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(','))
      .filter((parts) => parts.length >= 2)
      .map(([imageName, pid]) => [pid.trim(), imageName.trim()])
  )

  const seen = new Set()

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^TCP\s+/i.test(line))
    .map((line) => {
      const parts = line.split(/\s+/)
      if (parts.length < 5) return null

      const local = splitAddressPort(parts[1])
      const pid = parts[4]
      if (!local.port) return null

      const entry = {
        port: local.port,
        protocol: 'tcp',
        address: local.address || '*',
        process: pidMap.get(pid) || 'unknown',
        pid: Number(pid),
        state: parts[3] || 'LISTENING',
      }

      const key = `${entry.protocol}:${entry.port}:${entry.pid || entry.process}`
      if (seen.has(key)) return null
      seen.add(key)

      return entry
    })
    .filter(Boolean)
    .sort((a, b) => a.port - b.port || a.process.localeCompare(b.process))
}

function getActivePorts() {
  if (process.platform === 'linux') {
    if (!isAvailable('ss')) {
      throw new Error('ss is required on Linux to inspect active ports.')
    }

    const raw = execSync('ss -lntpH', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    return parseLinuxPorts(raw)
  }

  if (process.platform === 'darwin') {
    if (!isAvailable('lsof')) {
      throw new Error('lsof is required on macOS to inspect active ports.')
    }

    const raw = execSync('lsof -nP -iTCP -sTCP:LISTEN', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    return parseMacPorts(raw)
  }

  if (process.platform === 'win32') {
    const raw = execSync('netstat -ano -p tcp', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    const tasksRaw = execSync('tasklist /FO CSV /NH', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    }).toString()

    return parseWindowsPorts(raw, tasksRaw)
  }

  throw new Error(`Active port scanning is not supported on ${process.platform}.`)
}

export async function runPorts(options) {
  const resolvedOptions = typeof options?.opts === 'function' ? options.opts() : options
  const doJson = Boolean(
    resolvedOptions?.json ||
    options?.parent?.opts?.().json ||
    process.argv.includes('--json') ||
    process.argv.includes('-j')
  )
  const killTarget = resolvedOptions?.kill
  const useForce = Boolean(resolvedOptions?.force)
  const suspiciousOnly = Boolean(resolvedOptions?.check)

  const spinner = ora('Inspecting active ports...').start()

  try {
    const ports = getActivePorts()
    spinner.stop()

    if (ports.length === 0) {
      console.log(chalk.yellow('No active listening ports found.'))
      return
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      ports,
    }

    if (doJson) {
      console.log(JSON.stringify(payload, null, 2))
      return
    }

    const annotated = annotatePorts(ports)

    if (killTarget) {
      const numericTarget = Number(killTarget)
      const matched = annotated.filter(
        (entry) => entry.port === numericTarget || String(entry.pid || '') === String(killTarget)
      )

      if (matched.length === 0) {
        console.error(chalk.red(`✗ No listening port or PID matched "${killTarget}".`))
        process.exit(1)
      }

      const { killed, skipped } = terminatePorts(matched, { signal: useForce ? 'SIGKILL' : 'SIGTERM' })

      console.log(
        chalk.green(
          `✔ Sent ${useForce ? 'SIGKILL' : 'SIGTERM'} to ${killed.length} process(es) for ${matched.length} matching listener(s).`
        )
      )

      if (skipped.length > 0) {
        console.log(chalk.yellow(`Skipped ${skipped.length} listener(s) with no PID metadata.`))
      }

      renderPorts(matched, { includeHealth: true })
      return
    }

    if (suspiciousOnly) {
      const suspicious = filterSuspiciousPorts(annotated)

      if (suspicious.length === 0) {
        console.log(chalk.green('✔ No orphan or zombie listening ports found.'))
        return
      }

      renderBanner()
      renderPorts(suspicious, { includeHealth: true })
      return
    }

    renderBanner()
    renderPorts(annotated)
  } catch (err) {
    spinner.stop()
    console.error(chalk.red(`✗ ${err.message || 'Failed to inspect active ports.'}`))
    process.exit(1)
  }
}
