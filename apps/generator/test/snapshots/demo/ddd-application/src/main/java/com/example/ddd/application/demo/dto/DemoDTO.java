package com.example.ddd.application.demo.dto;

import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.model.DemoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/**
 * 演示 DTO（读模型，供接口层返回）。
 *
 * <p>聚合不直接暴露给外部；雪花 long 主键序列化为字符串，避免前端精度丢失。</p>
 */
public record DemoDTO(
        @JsonSerialize(using = ToStringSerializer.class) Long id,
        String code,
        String descText,
        Integer qty,
        BigDecimal amount,
        Boolean enabled,
        LocalDate bizDate,
        Instant createdTime,
        DemoStatus status,
        String extra,
        String traceId,
        String createdDept,
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy
) {

    /** 由聚合映射为对外读模型 */
    public static DemoDTO from(Demo aggregate) {
        return new DemoDTO(
                aggregate.id().value(),
                aggregate.code(),
                aggregate.descText(),
                aggregate.qty(),
                aggregate.amount(),
                aggregate.enabled(),
                aggregate.bizDate(),
                aggregate.createdTime(),
                aggregate.status(),
                aggregate.extra(),
                aggregate.traceId(),
                aggregate.createdDept(),
                aggregate.createdAt(),
                aggregate.createdBy(),
                aggregate.updatedAt(),
                aggregate.updatedBy());
    }
}
