package com.example.ddd.application.demo.command;

import com.example.ddd.domain.demo.model.DemoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * 创建演示命令（应用层输入）。
 *
 * <p>创建命令包含可编辑字段与创建部门；主键、创建时间、更新时间由聚合维护。</p>
 */
public record CreateDemoCommand(String code, String descText, Integer qty, BigDecimal amount, Boolean enabled, LocalDate bizDate, Instant createdTime, DemoStatus status, String extra, String traceId, String createdDept, String createdBy) {
}

