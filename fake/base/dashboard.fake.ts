import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import { dashboardFixture } from '../fixtures/dashboard'

export default defineFakeRoute({
  url: '/api/dashboard',
  method: 'GET',
  response: () => dashboardFixture,
})
