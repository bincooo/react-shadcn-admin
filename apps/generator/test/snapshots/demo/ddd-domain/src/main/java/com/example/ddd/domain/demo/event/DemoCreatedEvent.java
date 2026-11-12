package com.example.ddd.domain.demo.event;

import com.example.ddd.domain.shared.DomainEvent;
import java.time.Instant;

/**
 * 领域事件：演示已创建。
 */
public record DemoCreatedEvent(Long demoId, Instant occurredAt) implements DomainEvent {
}
