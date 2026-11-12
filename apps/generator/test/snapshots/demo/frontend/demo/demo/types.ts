/**
 * 演示前端类型：读模型对齐后端 DemoDTO，
 * 写模型只包含业务字段（主键与审计字段由后端维护）。
 */
export interface Demo {
  /** ID */
  id: string
  /** 编码 */
  code: string
  /** 描述 */
  descText?: string
  /** 数量 */
  qty: number
  /** 金额 */
  amount?: number
  /** 启用 */
  enabled: boolean
  /** 业务日期 */
  bizDate?: string
  /** 创建时间 */
  createdTime?: string
  /** 状态 */
  status: 'NEW' | 'DONE'
  /** 扩展 */
  extra?: string
  /** 追踪号 */
  traceId?: string
  /** 创建部门 */
  createdDept?: string
  /** 创建时间 */
  createdAt: string
  /** 创建人 */
  createdBy?: string
  /** 更新时间 */
  updatedAt: string
  /** 更新人 */
  updatedBy?: string
}

/** 新建 / 编辑演示的表单输入 */
export interface DemoInput {
  /** 编码 */
  code: string
  /** 描述 */
  descText?: string
  /** 数量 */
  qty: number
  /** 金额 */
  amount?: number
  /** 启用 */
  enabled: boolean
  /** 业务日期 */
  bizDate?: string
  /** 创建时间 */
  createdTime?: string
  /** 状态 */
  status: 'NEW' | 'DONE'
  /** 扩展 */
  extra?: string
  /** 追踪号 */
  traceId?: string
}
