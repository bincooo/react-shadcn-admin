package ${pkgs.domainEvent};

<#list imports as imp>import ${imp};
</#list>

/**
 * 领域事件：${displayName}已创建。
 */
public record ${entity}CreatedEvent(Long ${entityVar}Id, Instant occurredAt) implements DomainEvent {
}
