package com.example.ddd.application.order.service;

import com.example.ddd.application.order.command.CreateOrderCommand;
import com.example.ddd.application.order.command.UpdateOrderCommand;
import com.example.ddd.application.order.dto.OrderDTO;
import com.example.ddd.application.order.loader.OrderLoader;
import com.example.ddd.application.shared.DomainEventPublisher;
import com.example.ddd.domain.order.exception.OrderDomainException;
import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderId;
import com.example.ddd.domain.order.repository.OrderRepository;
import java.util.Objects;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 订单应用服务（写侧用例编排）。
 *
 * <p>职责：加载聚合 → 调用聚合行为 → 持久化 → 发布领域事件。
 * 唯一性等需要跨聚合判断的规则在本层校验。</p>
 */
@Service
@Transactional(rollbackFor = Exception.class)
@AllArgsConstructor
public class OrderCommandService {

    private final OrderRepository orderRepository;
    private final OrderLoader orderLoader;
    private final DomainEventPublisher eventPublisher;

    /** 用例：创建订单 */
    public OrderDTO create(CreateOrderCommand command) {
        ensureOrderNoAvailable(command.orderNo());
        Order saved = orderRepository.save(Order.create(OrderId.next(), command.orderNo(), command.customerName(), command.amount(), command.status(), command.remark(), command.createdDept(), command.createdBy()));
        eventPublisher.publishFrom(saved);
        return OrderDTO.from(saved);
    }

    /** 用例：更新订单 */
    public OrderDTO update(String id, UpdateOrderCommand command) {
        Order order = orderLoader.requireById(id);
        if (!Objects.equals(order.orderNo(), command.orderNo())
                && command.orderNo() != null
                && orderRepository.existsByOrderNo(command.orderNo())) {
            throw new OrderDomainException("订单号已存在: " + command.orderNo());
        }
        order.changeOrderNo(command.orderNo());
        order.changeCustomerName(command.customerName());
        order.changeAmount(command.amount());
        order.changeStatus(command.status());
        order.changeRemark(command.remark());
        if (command.updatedBy() != null) {
            order.changeUpdatedBy(command.updatedBy());
        }
        orderRepository.save(order);
        return OrderDTO.from(order);
    }

    /** 用例：删除订单 */
    public void delete(String id) {
        Order order = orderLoader.requireById(id);
        orderRepository.deleteById(order.id());
    }

    /** 订单号不能重复 */
    private void ensureOrderNoAvailable(String value) {
        if (value != null && orderRepository.existsByOrderNo(value)) {
            throw new OrderDomainException("订单号已存在: " + value);
        }
    }
}
