package com.example.ddd.domain.order.model;

import com.example.ddd.domain.order.event.OrderCreatedEvent;
import com.example.ddd.domain.order.exception.OrderDomainException;
import com.example.ddd.domain.order.model.OrderStatus;
import com.example.ddd.domain.shared.AggregateRoot;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * 订单聚合根（Aggregate Root）。
 *
 * <p>所有业务规则（非空、长度、唯一性之外的聚合内约束）收敛在聚合内部，
 * 外部只能通过行为方法修改状态。唯一性等跨聚合规则由应用服务判定。</p>
 */
public class Order extends AggregateRoot {

    private final OrderId id;
    private final Instant createdAt;
    private Instant updatedAt;
    private String orderNo;
    private String customerName;
    private BigDecimal amount;
    private OrderStatus status;
    private String remark;
    private String createdDept;
    private String createdBy;
    private String updatedBy;

    private Order(OrderId id, Instant createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    /**
     * 工厂方法：创建新订单。
     */
    public static Order create(OrderId id, String orderNo, String customerName, BigDecimal amount, OrderStatus status, String remark, String createdDept, String createdBy) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new OrderDomainException("订单号不能为空");
        }
        if (orderNo != null && orderNo.length() > 32) {
            throw new OrderDomainException("订单号长度不能超过 32");
        }
        if (customerName == null || customerName.isBlank()) {
            throw new OrderDomainException("客户名称不能为空");
        }
        if (customerName != null && customerName.length() > 64) {
            throw new OrderDomainException("客户名称长度不能超过 64");
        }
        if (amount == null) {
            throw new OrderDomainException("订单金额不能为空");
        }
        if (status == null) {
            throw new OrderDomainException("订单状态不能为空");
        }
        if (createdDept != null && createdDept.length() > 128) {
            throw new OrderDomainException("创建部门长度不能超过 128");
        }
        if (createdBy != null && createdBy.length() > 64) {
            throw new OrderDomainException("创建人长度不能超过 64");
        }
        Order aggregate = new Order(id, Instant.now());
        aggregate.orderNo = orderNo;
        aggregate.customerName = customerName;
        aggregate.amount = amount;
        aggregate.status = status;
        aggregate.remark = remark;
        aggregate.createdDept = createdDept;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = Instant.now();
        aggregate.registerEvent(new OrderCreatedEvent(id.value(), Instant.now()));
        return aggregate;
    }

    /**
     * 重建方法：仅供基础设施层从持久化数据还原聚合，不触发任何领域行为。
     */
    public static Order restore(OrderId id, String orderNo, String customerName, BigDecimal amount, OrderStatus status, String remark, String createdDept, Instant createdAt, String createdBy, Instant updatedAt, String updatedBy) {
        Order aggregate = new Order(id, createdAt);
        aggregate.orderNo = orderNo;
        aggregate.customerName = customerName;
        aggregate.amount = amount;
        aggregate.status = status;
        aggregate.remark = remark;
        aggregate.createdDept = createdDept;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = updatedAt;
        aggregate.updatedBy = updatedBy;
        return aggregate;
    }

    /** 变更订单号 */
    public void changeOrderNo(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new OrderDomainException("订单号不能为空");
        }
        if (orderNo != null && orderNo.length() > 32) {
            throw new OrderDomainException("订单号长度不能超过 32");
        }
        this.orderNo = orderNo;
        touch();
    }

    /** 变更客户名称 */
    public void changeCustomerName(String customerName) {
        if (customerName == null || customerName.isBlank()) {
            throw new OrderDomainException("客户名称不能为空");
        }
        if (customerName != null && customerName.length() > 64) {
            throw new OrderDomainException("客户名称长度不能超过 64");
        }
        this.customerName = customerName;
        touch();
    }

    /** 变更订单金额 */
    public void changeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new OrderDomainException("订单金额不能为空");
        }
        this.amount = amount;
        touch();
    }

    /** 变更订单状态 */
    public void changeStatus(OrderStatus status) {
        if (status == null) {
            throw new OrderDomainException("订单状态不能为空");
        }
        this.status = status;
        touch();
    }

    /** 变更备注 */
    public void changeRemark(String remark) {
        this.remark = remark;
        touch();
    }

    /** 变更更新人 */
    public void changeUpdatedBy(String updatedBy) {
        if (updatedBy != null && updatedBy.length() > 64) {
            throw new OrderDomainException("更新人长度不能超过 64");
        }
        this.updatedBy = updatedBy;
        touch();
    }

    /** 任何可编辑字段变化后刷新更新时间 */
    private void touch() {
        this.updatedAt = Instant.now();
    }

    public OrderId id() {
        return id;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public String orderNo() {
        return orderNo;
    }

    public String customerName() {
        return customerName;
    }

    public BigDecimal amount() {
        return amount;
    }

    public OrderStatus status() {
        return status;
    }

    public String remark() {
        return remark;
    }

    public String createdDept() {
        return createdDept;
    }

    public String createdBy() {
        return createdBy;
    }

    public String updatedBy() {
        return updatedBy;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Order other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
