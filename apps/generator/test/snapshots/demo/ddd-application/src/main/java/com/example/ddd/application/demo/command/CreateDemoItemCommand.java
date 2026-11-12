package com.example.ddd.application.demo.command;


/**
 * 创建演示明细命令（应用层输入）。
 *
 * <p>创建命令包含可编辑字段与创建部门；主键、创建时间、更新时间由聚合维护。</p>
 */
public record CreateDemoItemCommand(Long demoId, String itemName, String createdBy) {
}

