-- ============================================================
-- 表: sys_demo    实体: Demo
-- 方言: SQL Server
-- 生成时间: <TIMESTAMP>
-- 生成器: react-admin/apps/generator
-- ============================================================
-- 注意: 默认 dbo schema；使用 OBJECT_ID / sys.indexes 做存在性判断。
IF OBJECT_ID(N'dbo.sys_demo', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[sys_demo] (
        [id] BIGINT NOT NULL IDENTITY(1,1),
        [code] NVARCHAR(32) NOT NULL,
        [desc_text] NVARCHAR(MAX),
        [qty] INT NOT NULL DEFAULT 0,
        [amount] DECIMAL(18,4),
        [enabled] BIT NOT NULL DEFAULT 1,
        [biz_date] DATE,
        [created_time] DATETIME2,
        [status] NVARCHAR(16) NOT NULL DEFAULT 'NEW',
        [extra] NVARCHAR(MAX),
        [trace_id] UNIQUEIDENTIFIER,
        [created_dept] NVARCHAR(128),
        [created_at] DATETIME2 NOT NULL,
        [created_by] NVARCHAR(64),
        [updated_at] DATETIME2 NOT NULL,
        [updated_by] NVARCHAR(64),
        CONSTRAINT [pk_sys_demo] PRIMARY KEY ([id]),
        CONSTRAINT [uk_sys_demo_code] UNIQUE ([code])
    );
END;
GO

EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'演示表（覆盖全部列类型与明细表）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'主键 ID（雪花算法）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'id';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'编码', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'code';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'描述', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'desc_text';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'数量', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'qty';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'金额', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'amount';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'启用', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'enabled';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'业务日期', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'biz_date';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'created_time';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'状态（枚举: NEW: 新建, DONE: 完成）', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'status';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'扩展', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'extra';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'追踪号', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'trace_id';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建部门', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'created_dept';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'created_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'创建人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'created_by';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新时间', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'updated_at';
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'更新人', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'sys_demo', @level2type=N'COLUMN', @level2name=N'updated_by';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_demo_desc_text' AND object_id = OBJECT_ID(N'dbo.sys_demo'))
    CREATE INDEX [idx_sys_demo_desc_text] ON [dbo].[sys_demo] ([desc_text]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_demo_status' AND object_id = OBJECT_ID(N'dbo.sys_demo'))
    CREATE INDEX [idx_sys_demo_status] ON [dbo].[sys_demo] ([status]);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_sys_demo_trace_id' AND object_id = OBJECT_ID(N'dbo.sys_demo'))
    CREATE INDEX [idx_sys_demo_trace_id] ON [dbo].[sys_demo] ([trace_id]);
GO
