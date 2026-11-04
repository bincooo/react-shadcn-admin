import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import authRoutes from './routes/auth'
import deptRoutes from './routes/depts'
import menuRoutes from './routes/menus'
import roleRoutes from './routes/roles'
import userRoutes from './routes/users'

/**
 * 全量 mock 的唯一入口。
 *
 * vite-plugin-fake-server 会按 `*.fake.ts` 文件分别打包，若把路由拆成多个
 * fake 文件，每个包都会各自持有一份 mock-state，CRUD 结果无法跨文件共享。
 * 因此路由实现放在 routes/*.ts，只在这里聚合导出。
 */
export default defineFakeRoute([
  ...authRoutes,
  ...menuRoutes,
  ...userRoutes,
  ...roleRoutes,
  ...deptRoutes,
])
