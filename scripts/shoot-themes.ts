import { browser } from 'bunwright'

const BASE = process.env.SHOT_BASE || 'http://localhost:3013'

const page = await browser.newPage()
await page.navigate(`${BASE}/`)
await Bun.sleep(1800)

function apply(theme: string, dark: boolean) {
  return page.evaluate(
    new Function(
      `document.documentElement.dataset.gameTheme=${JSON.stringify(theme)};` +
        `document.documentElement.classList.toggle('dark', ${dark});` +
        `document.documentElement.classList.toggle('light', ${!dark});`,
    ) as () => void,
  )
}

for (const theme of ['felt', 'arcade', 'neon'] as const) {
  for (const dark of [true, false]) {
    await apply(theme, dark)
    await Bun.sleep(550)
    await page.screenshot(`/tmp/shots/home-${theme}-${dark ? 'dark' : 'light'}.png`)
    console.log('shot', theme, dark ? 'dark' : 'light')
  }
}

await browser.close()
