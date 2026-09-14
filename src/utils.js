export function isAvailable(cmd) {
  return Boolean(Bun.which(cmd))
}

export function runCommand(command, { timeout = 10000, stderr = 'ignore' } = {}) {
  const shell = process.platform === 'win32' ? ['cmd.exe', '/d', '/s', '/c'] : ['sh', '-c']
  const result = Bun.spawnSync({
    cmd: [...shell, command],
    stdout: 'pipe',
    stderr,
    timeout,
  })

  if (result.exitCode !== 0) {
    const error = new Error(`command exited with code ${result.exitCode ?? 1}`)
    Object.assign(error, result)
    throw error
  }

  return result.stdout.toString()
}

// Read a flag value straight from argv — commander fallback for nested commands.
export function getCliOptionValue(flags) {
  for (let index = 0; index < process.argv.length; index += 1) {
    if (flags.includes(process.argv[index])) return process.argv[index + 1]
  }
  return undefined
}

export function hasCliFlag(flags) {
  return process.argv.some((token) => flags.includes(token))
}

// Commander hands the action a Command instance; direct calls pass plain options.
export function optsOf(options) {
  return typeof options?.opts === 'function' ? options.opts() : options
}

// Parse tab-separated `name\tversion` lines into system package records.
// Shared by the dpkg/rpm-style scanners (apt, dnf, ...).
export function parseTabbed(raw) {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, version] = line.split('\t')
      return { name: name?.trim(), version: version?.trim() || 'unknown', type: 'system' }
    })
    .filter((pkg) => pkg.name)
}

// Shared scanner shell: resolve the binary, run one command, parse stdout.
// Keeps the permission/timeout warning contract used by every scanner.
export async function runScanner({
  manager,
  bin,
  command,
  parse,
  permissionHint,
  timeout = 10000,
}) {
  const binName = Array.isArray(bin) ? bin.find(isAvailable) : isAvailable(bin) ? bin : null
  if (!binName) return null

  try {
    const cmd = typeof command === 'function' ? command(binName) : command
    const raw = runCommand(cmd, { timeout })
    return { manager, packages: await parse(raw) }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn(`⚠ ${manager}: ${permissionHint || 'permission denied. Try running with sudo.'}`)
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn(`⚠ ${manager}: scan timed out, skipping.`)
    }
    return null
  }
}
