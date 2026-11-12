package com.example.ddd.application.order.command;

import com.example.ddd.domain.order.model.OrderStatus;
import java.math.BigDecimal;

/**
 * 更新订单命令（应用层输入）。
 *
 * <p>更新命令只包含可编辑字段；主键与审计字段不参与更新。</p>
 */
public record UpdateOrderCommand(String orderNo, String customerName, BigDecimal amount, OrderStatus status, String remark, String updatedBy) {
}

