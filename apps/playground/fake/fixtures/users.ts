import type { User } from '@/api/system/user'
import { deptSeeds } from './depts'
import { roleSeeds } from './roles'

const DEPT_NAMES = new Map(deptSeeds.map((dept) => [dept.id, dept.deptName]))
const ROLE_NAMES = new Map(
  roleSeeds.map((role) => [role.roleCode, role.roleName]),
)

/** 种子用户的角色名称；未知编码回退为编码本身 */
function roleNamesOf(codes: string[]): string[] {
  return codes.map((code) => ROLE_NAMES.get(code) ?? code)
}

/** 用户可归属的末级 / 二级部门（不含总公司） */
const DEPT_IDS = [
  '111',
  '112',
  '113',
  '121',
  '122',
  '131',
  '132',
  '110',
  '120',
  '130',
]

const SURNAMES = [
  '陈',
  '沈',
  '周',
  '林',
  '顾',
  '陆',
  '苏',
  '江',
  '叶',
  '许',
  '程',
  '方',
  '韩',
  '唐',
  '宋',
  '魏',
  '冯',
  '邓',
  '曹',
  '彭',
  '萧',
  '袁',
  '蒋',
  '蔡',
  '潘',
  '田',
  '董',
  '余',
  '杜',
  '姜',
]

const GIVEN_NAMES = [
  '星野',
  '知微',
  '砚清',
  '照月',
  '南枝',
  '则鸣',
  '晚晴',
  '叙白',
  '栖迟',
  '清晏',
  '既明',
  '澄',
  '澈',
  '若初',
  '以宁',
  '书言',
  '望舒',
  '云舒',
  '听澜',
  '静姝',
  '修远',
  '疏影',
  '北辰',
  '流川',
  '嘉树',
  '问渠',
  '观棋',
  '临溪',
  '映雪',
  '长风',
  '明烛',
  '白露',
  '青禾',
  '知远',
  '若谷',
  '含章',
  '怀瑾',
  '南乔',
  '慕白',
  '景行',
  '思齐',
  '雨眠',
  '山青',
  '月白',
  '疏桐',
  '星阑',
  '晚舟',
  '知夏',
  '听雪',
  '归鸿',
]

const JOBS = [
  '前端工程师',
  '后端工程师',
  '测试工程师',
  '产品经理',
  '视觉设计师',
  '市场专员',
  '客户成功经理',
]

/** 固定种子生成的用户 id，保持每次启动一致 */
function userId(index: number): string {
  return String(1800000000000000000n + BigInt(index))
}

function buildName(index: number): string {
  return (
    SURNAMES[index % SURNAMES.length] + GIVEN_NAMES[index % GIVEN_NAMES.length]
  )
}

function buildUser(index: number): User {
  const isAdmin = index === 1
  const isDemo = index === 2
  const username = isAdmin
    ? 'admin'
    : isDemo
      ? 'demo'
      : `user${String(index).padStart(3, '0')}`
  const nickname = isAdmin ? '林晚舟' : isDemo ? '演示账号' : buildName(index)
  const deptId = DEPT_IDS[index % DEPT_IDS.length]
  const registerTime = new Date(
    Date.UTC(2024, 0, 1) + index * 7 * 24 * 60 * 60 * 1000,
  ).toISOString()
  const roles = isAdmin || index % 9 === 0 ? ['admin'] : ['common']

  return {
    id: userId(index),
    username,
    nickname,
    avatar: undefined,
    email: `${username}@example.com`,
    phone: `139${String(10_000_000 + index).padStart(8, '0')}`,
    signature: isDemo ? '纯前端 mock 演示账号' : undefined,
    sex: index % 2 === 0 ? '女' : '男',
    job: JOBS[index % JOBS.length],
    deptId,
    deptName: DEPT_NAMES.get(deptId),
    roles,
    roleNames: roleNamesOf(roles),
    enabled: isAdmin || index % 8 !== 0,
    registerTime,
  }
}

/** 57 个系统用户：覆盖分页、筛选、启用/停用与角色分布 */
export const userSeeds: User[] = Array.from({ length: 57 }, (_, offset) =>
  buildUser(offset + 1),
)
