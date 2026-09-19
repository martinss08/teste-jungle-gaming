import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { applyScenarioFromUrl } from './scenarios'

export const worker = setupWorker(...handlers)

export async function startMockWorker() {
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
  applyScenarioFromUrl()
}
