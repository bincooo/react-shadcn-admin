-- ============================================================
-- 表: sys_demo_item    实体: DemoItem
-- 方言: SQL Server
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 默认 dbo schema；使用 OBJECT_ID / sys.indexes 做存在性判断。
IF OBJECT_ID(N'dbo.sys_demo_item', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[sys_demo_item] (
        [id] BIGINT NOT NULL IDENTITY(1,1),
        [demo_id] BIGINT NOT NULL,
        [item_name] NVARCHAR(64) NOT NULL,
        [created_at] DATETIME2 NOT NULL,
        [created_by] NVARCHAR(64),
        [updated_at] DATETIME2 NOT NULL,
        [updated_by] NVARCHAR(64),
        CONSTRAINT [pk_sys_demo_item] PRIMARY KEY ([id])
    );
END;
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'演示明细表', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'主键 ID（雪花算法）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'id';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'主表ID', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'demo_id';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'名称', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'item_name';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'created_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'created_by';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'updated_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo_item', @level2type=N'COLUMN', @level2name=N'updated_by';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_demo_item_demo_id' AND object_id = OBJECT_ID(N'dbo.sys_demo_item'))
    CREATE INDEX [idx_sys_demo_item_demo_id] ON [dbo].[sys_demo_item] ([demo_id]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_demo_item_item_name' AND object_id = OBJECT_ID(N'dbo.sys_demo_item'))
    CREATE INDEX [idx_sys_demo_item_item_name] ON [dbo].[sys_demo_item] ([item_name]);
GO
