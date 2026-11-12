package com.example.ddd.application.demo.dto;

import com.example.ddd.domain.demo.model.DemoItem;
import java.time.Instant;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/**
 * 演示明细 DTO（读模型，供接口层返回）。
 *
 * <p>聚合不直接暴露给外部；雪花 long 主键序列化为字符串，避免前端精度丢失。</p>
 */
public record DemoItemDTO(
        @JsonSerialize(using = ToStringSerializer.class) Long id,
        Long demoId,
        String itemName,
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy
) {

    /** 由聚合映射为对外读模型 */
    public static DemoItemDTO from(DemoItem aggregate) {
        return new DemoItemDTO(
                aggregate.id().value(),
                aggregate.demoId(),
                aggregate.itemName(),
                aggregate.createdAt(),
                aggregate.createdBy(),
                aggregate.updatedAt(),
                aggregate.updatedBy());
    }
}
