-- ============================================================
-- 表: sys_order    实体: Order
-- 方言: MySQL
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 需 MySQL 5.7+；JSON 列使用原生 JSON 类型。
CREATE TABLE IF NOT EXISTS `sys_order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID（雪花算法）',
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
    `customer_name` VARCHAR(64) NOT NULL COMMENT '客户名称',
    `amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
    `status` VARCHAR(16) NOT NULL DEFAULT 'NEW' COMMENT '订单状态（枚举: NEW: 新建, PAID: 已支付, SHIPPED: 已发货）',
    `remark` TEXT COMMENT '备注',
    `created_dept` VARCHAR(128) COMMENT '创建部门',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(64) COMMENT '创建人',
    `updated_at` DATETIME(3) NOT NULL COMMENT '更新时间',
    `updated_by` VARCHAR(64) COMMENT '更新人',
    CONSTRAINT `pk_sys_order` PRIMARY KEY (`id`),
    CONSTRAINT `uk_sys_order_order_no` UNIQUE (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

CREATE INDEX `idx_sys_order_customer_name` ON `sys_order` (`customer_name`);
CREATE INDEX `idx_sys_order_status` ON `sys_order` (`status`);
CREATE INDEX `idx_sys_order_remark` ON `sys_order` (`remark`);
