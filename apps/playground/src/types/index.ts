/**
 * 后端通用分页信封。
 *
 * 所有分页查询接口都返回这一层结构，只有 `records` 的元素类型不同。
 * 泛型参数在任何地方现填即可 —— 调用处直接写 `get<PageResult<User>>('/users')`，
 * 不额外定义「只继承它、不加成员」的具名空接口，少一层需要维护和跳转的间接层。
 * 字段含义与增删改都在这一处维护，避免多处复制后逐渐跑偏。
 *
 * 字段命名对齐后端 `PageResult`：`size` 为每页条数（请求侧同名参数），
 * `page` 从 1 开始，`totalPages` 由后端计算后下发，前端不再自行推导。
 */
export interface PageResult<T> {
  /** 当前页数据 */
  records: T[]
  /** 满足条件的总条数（非当前页条数） */
  total: number
  /** 当前页码，从 1 开始 */
  page: number
  /** 每页条数 */
  size: number
  /** 总页数，由后端计算 */
  totalPages: number
}

/** 查询串允许的标量类型；null/undefined 由 `lib/http` 过滤掉 */
export type QueryParamValue = string | number | null | undefined
