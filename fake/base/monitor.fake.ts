import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import { monitorFixture } from '../fixtures/monitor'

export default defineFakeRoute({
  url: '/api/monitor',
  method: 'GET',
  response: () => monitorFixture,
})
