-- ============================================================
-- 表: sys_order    实体: Order
-- 方言: SQL Server
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 默认 dbo schema；使用 OBJECT_ID / sys.indexes 做存在性判断。
IF OBJECT_ID(N'dbo.sys_order', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[sys_order] (
        [id] BIGINT NOT NULL IDENTITY(1,1),
        [order_no] NVARCHAR(32) NOT NULL,
        [customer_name] NVARCHAR(64) NOT NULL,
        [amount] DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        [status] NVARCHAR(16) NOT NULL DEFAULT 'NEW',
        [remark] NVARCHAR(MAX),
        [created_dept] NVARCHAR(128),
        [created_at] DATETIME2 NOT NULL,
        [created_by] NVARCHAR(64),
        [updated_at] DATETIME2 NOT NULL,
        [updated_by] NVARCHAR(64),
        CONSTRAINT [pk_sys_order] PRIMARY KEY ([id]),
        CONSTRAINT [uk_sys_order_order_no] UNIQUE ([order_no])
    );
END;
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'订单主表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'主键 ID（雪花算法）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'id';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'订单号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'order_no';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'客户名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'customer_name';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'订单金额', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'amount';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'订单状态（枚举: NEW: 新建, PAID: 已支付, SHIPPED: 已发货）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'status';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'备注', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'remark';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建部门', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'created_dept';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'created_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'created_by';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'updated_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_order', @level2type=N'COLUMN', @level2name=N'updated_by';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_order_customer_name' AND object_id = OBJECT_ID(N'dbo.sys_order'))
    CREATE INDEX [idx_sys_order_customer_name] ON [dbo].[sys_order] ([customer_name]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_order_status' AND object_id = OBJECT_ID(N'dbo.sys_order'))
    CREATE INDEX [idx_sys_order_status] ON [dbo].[sys_order] ([status]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_order_remark' AND object_id = OBJECT_ID(N'dbo.sys_order'))
    CREATE INDEX [idx_sys_order_remark] ON [dbo].[sys_order] ([remark]);
GO
