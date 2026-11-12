-- ============================================================
-- 表: sys_demo_item    实体: DemoItem
-- 方言: MySQL
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 需 MySQL 5.7+；JSON 列使用原生 JSON 类型。
CREATE TABLE IF NOT EXISTS `sys_demo_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID（雪花算法）',
    `demo_id` BIGINT NOT NULL COMMENT '主表ID',
    `item_name` VARCHAR(64) NOT NULL COMMENT '名称',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(64) COMMENT '创建人',
    `updated_at` DATETIME(3) NOT NULL COMMENT '更新时间',
    `updated_by` VARCHAR(64) COMMENT '更新人',
    CONSTRAINT `pk_sys_demo_item` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='演示明细表';

CREATE INDEX `idx_sys_demo_item_demo_id` ON `sys_demo_item` (`demo_id`);
CREATE INDEX `idx_sys_demo_item_item_name` ON `sys_demo_item` (`item_name`);
