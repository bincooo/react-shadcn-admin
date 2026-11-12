package com.example.ddd.application.demo.command;

import com.example.ddd.domain.demo.model.DemoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * 更新演示命令（应用层输入）。
 *
 * <p>更新命令只包含可编辑字段；主键与审计字段不参与更新。</p>
 */
public record UpdateDemoCommand(String code, String descText, Integer qty, BigDecimal amount, Boolean enabled, LocalDate bizDate, Instant createdTime, DemoStatus status, String extra, String traceId, String updatedBy) {
}

