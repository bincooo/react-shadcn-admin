/**
 * 订单前端类型：读模型对齐后端 OrderDTO，
 * 写模型只包含业务字段（主键与审计字段由后端维护）。
 */
export interface Order {
  /** ID */
  id: string
  /** 订单号 */
  orderNo: string
  /** 客户名称 */
  customerName: string
  /** 金额 */
  amount: number
  /** 状态 */
  status: 'NEW' | 'PAID' | 'SHIPPED'
  /** 备注 */
  remark?: string
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

/** 新建 / 编辑订单的表单输入 */
export interface OrderInput {
  /** 订单号 */
  orderNo: string
  /** 客户名称 */
  customerName: string
  /** 金额 */
  amount: number
  /** 状态 */
  status: 'NEW' | 'PAID' | 'SHIPPED'
  /** 备注 */
  remark?: string
}
