-- ============================================================
-- 表: sys_demo    实体: Demo
-- 方言: MySQL
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 需 MySQL 5.7+；JSON 列使用原生 JSON 类型。
CREATE TABLE IF NOT EXISTS `sys_demo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID（雪花算法）',
    `code` VARCHAR(32) NOT NULL COMMENT '编码',
    `desc_text` TEXT COMMENT '描述',
    `qty` INT NOT NULL DEFAULT 0 COMMENT '数量',
    `amount` DECIMAL(18,4) COMMENT '金额',
    `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '启用',
    `biz_date` DATE COMMENT '业务日期',
    `created_time` DATETIME(3) COMMENT '创建时间',
    `status` VARCHAR(16) NOT NULL DEFAULT 'NEW' COMMENT '状态（枚举: NEW: 新建, DONE: 完成）',
    `extra` JSON COMMENT '扩展',
    `trace_id` CHAR(36) COMMENT '追踪号',
    `created_dept` VARCHAR(128) COMMENT '创建部门',
    `created_at` DATETIME(3) NOT NULL COMMENT '创建时间',
    `created_by` VARCHAR(64) COMMENT '创建人',
    `updated_at` DATETIME(3) NOT NULL COMMENT '更新时间',
    `updated_by` VARCHAR(64) COMMENT '更新人',
    CONSTRAINT `pk_sys_demo` PRIMARY KEY (`id`),
    CONSTRAINT `uk_sys_demo_code` UNIQUE (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='演示表（覆盖全部列类型与明细表）';

CREATE INDEX `idx_sys_demo_desc_text` ON `sys_demo` (`desc_text`);
CREATE INDEX `idx_sys_demo_status` ON `sys_demo` (`status`);
CREATE INDEX `idx_sys_demo_trace_id` ON `sys_demo` (`trace_id`);
