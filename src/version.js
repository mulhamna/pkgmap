const { version } = await Bun.file(new URL('../package.json', import.meta.url)).json()

export const APP_VERSION = version
