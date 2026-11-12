package com.example.ddd.domain.order.event;

import com.example.ddd.domain.shared.DomainEvent;
import java.time.Instant;

/**
 * 领域事件：订单已创建。
 */
public record OrderCreatedEvent(Long orderId, Instant occurredAt) implements DomainEvent {
}
