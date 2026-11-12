package com.example.ddd.application.order.command;

import com.example.ddd.domain.order.model.OrderStatus;
import java.math.BigDecimal;

/**
 * 创建订单命令（应用层输入）。
 *
 * <p>创建命令包含可编辑字段与创建部门；主键、创建时间、更新时间由聚合维护。</p>
 */
public record CreateOrderCommand(String orderNo, String customerName, BigDecimal amount, OrderStatus status, String remark, String createdDept, String createdBy) {
}

