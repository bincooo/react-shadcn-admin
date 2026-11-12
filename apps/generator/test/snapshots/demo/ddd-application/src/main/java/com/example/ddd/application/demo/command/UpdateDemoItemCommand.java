package com.example.ddd.application.demo.command;


/**
 * 更新演示明细命令（应用层输入）。
 *
 * <p>更新命令只包含可编辑字段；主键与审计字段不参与更新。</p>
 */
public record UpdateDemoItemCommand(Long demoId, String itemName, String updatedBy) {
}

