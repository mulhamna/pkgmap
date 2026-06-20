import { execSync } from 'child_process'

export function isAvailable(cmd) {
  const which = process.platform === 'win32' ? 'where' : 'which'
  try {
    execSync(`${which} ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
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
    const raw = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout }).toString()
    return { manager, packages: parse(raw) }
  } catch (err) {
    if (err.message?.includes('EACCES') || err.message?.includes('permission')) {
      console.warn(`⚠ ${manager}: ${permissionHint || 'permission denied. Try running with sudo.'}`)
    } else if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
      console.warn(`⚠ ${manager}: scan timed out, skipping.`)
    }
    return null
  }
}
