package com.example.ddd.application.order.dto;

import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/**
 * 订单 DTO（读模型，供接口层返回）。
 *
 * <p>聚合不直接暴露给外部；雪花 long 主键序列化为字符串，避免前端精度丢失。</p>
 */
public record OrderDTO(
        @JsonSerialize(using = ToStringSerializer.class) Long id,
        String orderNo,
        String customerName,
        BigDecimal amount,
        OrderStatus status,
        String remark,
        String createdDept,
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy
) {

    /** 由聚合映射为对外读模型 */
    public static OrderDTO from(Order aggregate) {
        return new OrderDTO(
                aggregate.id().value(),
                aggregate.orderNo(),
                aggregate.customerName(),
                aggregate.amount(),
                aggregate.status(),
                aggregate.remark(),
                aggregate.createdDept(),
                aggregate.createdAt(),
                aggregate.createdBy(),
                aggregate.updatedAt(),
                aggregate.updatedBy());
    }
}
