package com.example.ddd.application.order.loader;

import com.example.ddd.application.shared.Loaders;
import com.example.ddd.domain.order.exception.OrderNotFoundException;
import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderId;
import com.example.ddd.domain.order.repository.OrderRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 订单加载器：按 ID 加载聚合，不存在时抛领域异常。
 */
@Component
@AllArgsConstructor
public class OrderLoader {

    private final OrderRepository orderRepository;

    /** 按 ID 加载；不存在时抛出 {@link OrderNotFoundException} */
    public Order requireById(String id) {
        OrderId orderId = OrderId.parse(id);
        return Loaders.orThrow(orderRepository.findById(orderId),
                () -> new OrderNotFoundException(orderId));
    }
}
