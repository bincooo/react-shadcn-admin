/**
 * 演示明细前端类型：读模型对齐后端 DemoItemDTO，
 * 写模型只包含业务字段（主键与审计字段由后端维护）。
 */
export interface DemoItem {
  /** ID */
  id: string
  /** 主表ID */
  demoId: number
  /** 名称 */
  itemName: string
  /** 创建时间 */
  createdAt: string
  /** 创建人 */
  createdBy?: string
  /** 更新时间 */
  updatedAt: string
  /** 更新人 */
  updatedBy?: string
}

/** 新建 / 编辑演示明细的表单输入 */
export interface DemoItemInput {
  /** 主表ID */
  demoId: number
  /** 名称 */
  itemName: string
}
