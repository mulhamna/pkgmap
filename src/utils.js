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
