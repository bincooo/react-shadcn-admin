package com.example.ddd.domain.demo.event;

import com.example.ddd.domain.shared.DomainEvent;
import java.time.Instant;

/**
 * 领域事件：演示明细已创建。
 */
public record DemoItemCreatedEvent(Long demoItemId, Instant occurredAt) implements DomainEvent {
}
