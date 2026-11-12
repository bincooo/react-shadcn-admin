package com.example.ddd.infrastructure.order.persistence.converter;

import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderId;
import com.example.ddd.infrastructure.order.persistence.po.OrderPO;

/**
 * 订单 领域 ↔ PO 转换（防腐层）。
 *
 * <p>不可变字段经 {@link Order#restore} 全参数重建，不走 setter / 反射。</p>
 */
public final class OrderPersistenceConverter {

    private OrderPersistenceConverter() {
    }

    /** 领域聚合 → PO */
    public static OrderPO toPO(Order aggregate) {
        OrderPO po = new OrderPO();
        po.setId(aggregate.id().value());
        po.setOrderNo(aggregate.orderNo());
        po.setCustomerName(aggregate.customerName());
        po.setAmount(aggregate.amount());
        po.setStatus(aggregate.status());
        po.setRemark(aggregate.remark());
        po.setCreatedDept(aggregate.createdDept());
        po.setCreatedAt(aggregate.createdAt());
        po.setCreatedBy(aggregate.createdBy());
        po.setUpdatedAt(aggregate.updatedAt());
        po.setUpdatedBy(aggregate.updatedBy());
        return po;
    }

    /** PO → 领域聚合（经 restore 工厂重建，不触发领域行为） */
    public static Order toDomain(OrderPO po) {
        return Order.restore(
                OrderId.of(po.getId()),
                po.getOrderNo(),
                po.getCustomerName(),
                po.getAmount(),
                po.getStatus(),
                po.getRemark(),
                po.getCreatedDept(),
                po.getCreatedAt(),
                po.getCreatedBy(),
                po.getUpdatedAt(),
                po.getUpdatedBy());
    }
}
