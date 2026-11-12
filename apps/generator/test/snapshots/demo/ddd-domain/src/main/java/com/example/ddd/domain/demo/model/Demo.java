package com.example.ddd.domain.demo.model;

import com.example.ddd.domain.demo.event.DemoCreatedEvent;
import com.example.ddd.domain.demo.exception.DemoDomainException;
import com.example.ddd.domain.demo.model.DemoStatus;
import com.example.ddd.domain.shared.AggregateRoot;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

/**
 * 演示聚合根（Aggregate Root）。
 *
 * <p>所有业务规则（非空、长度、唯一性之外的聚合内约束）收敛在聚合内部，
 * 外部只能通过行为方法修改状态。唯一性等跨聚合规则由应用服务判定。</p>
 */
public class Demo extends AggregateRoot {

    private final DemoId id;
    private final Instant createdAt;
    private Instant updatedAt;
    private String code;
    private String descText;
    private Integer qty;
    private BigDecimal amount;
    private Boolean enabled;
    private LocalDate bizDate;
    private Instant createdTime;
    private DemoStatus status;
    private String extra;
    private String traceId;
    private String createdDept;
    private String createdBy;
    private String updatedBy;

    private Demo(DemoId id, Instant createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    /**
     * 工厂方法：创建新演示。
     */
    public static Demo create(DemoId id, String code, String descText, Integer qty, BigDecimal amount, Boolean enabled, LocalDate bizDate, Instant createdTime, DemoStatus status, String extra, String traceId, String createdDept, String createdBy) {
        if (code == null || code.isBlank()) {
            throw new DemoDomainException("编码不能为空");
        }
        if (code != null && code.length() > 32) {
            throw new DemoDomainException("编码长度不能超过 32");
        }
        if (qty == null) {
            throw new DemoDomainException("数量不能为空");
        }
        if (enabled == null) {
            throw new DemoDomainException("启用不能为空");
        }
        if (status == null) {
            throw new DemoDomainException("状态不能为空");
        }
        if (traceId != null && traceId.length() > 36) {
            throw new DemoDomainException("追踪号长度不能超过 36");
        }
        if (createdDept != null && createdDept.length() > 128) {
            throw new DemoDomainException("创建部门长度不能超过 128");
        }
        if (createdBy != null && createdBy.length() > 64) {
            throw new DemoDomainException("创建人长度不能超过 64");
        }
        Demo aggregate = new Demo(id, Instant.now());
        aggregate.code = code;
        aggregate.descText = descText;
        aggregate.qty = qty;
        aggregate.amount = amount;
        aggregate.enabled = enabled;
        aggregate.bizDate = bizDate;
        aggregate.createdTime = createdTime;
        aggregate.status = status;
        aggregate.extra = extra;
        aggregate.traceId = traceId;
        aggregate.createdDept = createdDept;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = Instant.now();
        aggregate.registerEvent(new DemoCreatedEvent(id.value(), Instant.now()));
        return aggregate;
    }

    /**
     * 重建方法：仅供基础设施层从持久化数据还原聚合，不触发任何领域行为。
     */
    public static Demo restore(DemoId id, String code, String descText, Integer qty, BigDecimal amount, Boolean enabled, LocalDate bizDate, Instant createdTime, DemoStatus status, String extra, String traceId, String createdDept, Instant createdAt, String createdBy, Instant updatedAt, String updatedBy) {
        Demo aggregate = new Demo(id, createdAt);
        aggregate.code = code;
        aggregate.descText = descText;
        aggregate.qty = qty;
        aggregate.amount = amount;
        aggregate.enabled = enabled;
        aggregate.bizDate = bizDate;
        aggregate.createdTime = createdTime;
        aggregate.status = status;
        aggregate.extra = extra;
        aggregate.traceId = traceId;
        aggregate.createdDept = createdDept;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = updatedAt;
        aggregate.updatedBy = updatedBy;
        return aggregate;
    }

    /** 变更编码 */
    public void changeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new DemoDomainException("编码不能为空");
        }
        if (code != null && code.length() > 32) {
            throw new DemoDomainException("编码长度不能超过 32");
        }
        this.code = code;
        touch();
    }

    /** 变更描述 */
    public void changeDescText(String descText) {
        this.descText = descText;
        touch();
    }

    /** 变更数量 */
    public void changeQty(Integer qty) {
        if (qty == null) {
            throw new DemoDomainException("数量不能为空");
        }
        this.qty = qty;
        touch();
    }

    /** 变更金额 */
    public void changeAmount(BigDecimal amount) {
        this.amount = amount;
        touch();
    }

    /** 变更启用 */
    public void changeEnabled(Boolean enabled) {
        if (enabled == null) {
            throw new DemoDomainException("启用不能为空");
        }
        this.enabled = enabled;
        touch();
    }

    /** 变更业务日期 */
    public void changeBizDate(LocalDate bizDate) {
        this.bizDate = bizDate;
        touch();
    }

    /** 变更创建时间 */
    public void changeCreatedTime(Instant createdTime) {
        this.createdTime = createdTime;
        touch();
    }

    /** 变更状态 */
    public void changeStatus(DemoStatus status) {
        if (status == null) {
            throw new DemoDomainException("状态不能为空");
        }
        this.status = status;
        touch();
    }

    /** 变更扩展 */
    public void changeExtra(String extra) {
        this.extra = extra;
        touch();
    }

    /** 变更追踪号 */
    public void changeTraceId(String traceId) {
        if (traceId != null && traceId.length() > 36) {
            throw new DemoDomainException("追踪号长度不能超过 36");
        }
        this.traceId = traceId;
        touch();
    }

    /** 变更更新人 */
    public void changeUpdatedBy(String updatedBy) {
        if (updatedBy != null && updatedBy.length() > 64) {
            throw new DemoDomainException("更新人长度不能超过 64");
        }
        this.updatedBy = updatedBy;
        touch();
    }

    /** 任何可编辑字段变化后刷新更新时间 */
    private void touch() {
        this.updatedAt = Instant.now();
    }

    public DemoId id() {
        return id;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public String code() {
        return code;
    }

    public String descText() {
        return descText;
    }

    public Integer qty() {
        return qty;
    }

    public BigDecimal amount() {
        return amount;
    }

    public Boolean enabled() {
        return enabled;
    }

    public LocalDate bizDate() {
        return bizDate;
    }

    public Instant createdTime() {
        return createdTime;
    }

    public DemoStatus status() {
        return status;
    }

    public String extra() {
        return extra;
    }

    public String traceId() {
        return traceId;
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
        return o instanceof Demo other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
