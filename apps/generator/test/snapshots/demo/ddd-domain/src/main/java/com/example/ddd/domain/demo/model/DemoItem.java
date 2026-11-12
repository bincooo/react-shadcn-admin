package com.example.ddd.domain.demo.model;

import com.example.ddd.domain.demo.event.DemoItemCreatedEvent;
import com.example.ddd.domain.demo.exception.DemoItemDomainException;
import com.example.ddd.domain.shared.AggregateRoot;
import java.time.Instant;
import java.util.Objects;

/**
 * 演示明细聚合根（Aggregate Root）。
 *
 * <p>所有业务规则（非空、长度、唯一性之外的聚合内约束）收敛在聚合内部，
 * 外部只能通过行为方法修改状态。唯一性等跨聚合规则由应用服务判定。</p>
 */
public class DemoItem extends AggregateRoot {

    private final DemoItemId id;
    private final Instant createdAt;
    private Instant updatedAt;
    private Long demoId;
    private String itemName;
    private String createdBy;
    private String updatedBy;

    private DemoItem(DemoItemId id, Instant createdAt) {
        this.id = id;
        this.createdAt = createdAt;
    }

    /**
     * 工厂方法：创建新演示明细。
     */
    public static DemoItem create(DemoItemId id, Long demoId, String itemName, String createdBy) {
        if (demoId == null) {
            throw new DemoItemDomainException("主表ID不能为空");
        }
        if (itemName == null || itemName.isBlank()) {
            throw new DemoItemDomainException("名称不能为空");
        }
        if (itemName != null && itemName.length() > 64) {
            throw new DemoItemDomainException("名称长度不能超过 64");
        }
        if (createdBy != null && createdBy.length() > 64) {
            throw new DemoItemDomainException("创建人长度不能超过 64");
        }
        DemoItem aggregate = new DemoItem(id, Instant.now());
        aggregate.demoId = demoId;
        aggregate.itemName = itemName;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = Instant.now();
        aggregate.registerEvent(new DemoItemCreatedEvent(id.value(), Instant.now()));
        return aggregate;
    }

    /**
     * 重建方法：仅供基础设施层从持久化数据还原聚合，不触发任何领域行为。
     */
    public static DemoItem restore(DemoItemId id, Long demoId, String itemName, Instant createdAt, String createdBy, Instant updatedAt, String updatedBy) {
        DemoItem aggregate = new DemoItem(id, createdAt);
        aggregate.demoId = demoId;
        aggregate.itemName = itemName;
        aggregate.createdBy = createdBy;
        aggregate.updatedAt = updatedAt;
        aggregate.updatedBy = updatedBy;
        return aggregate;
    }

    /** 变更主表ID */
    public void changeDemoId(Long demoId) {
        if (demoId == null) {
            throw new DemoItemDomainException("主表ID不能为空");
        }
        this.demoId = demoId;
        touch();
    }

    /** 变更名称 */
    public void changeItemName(String itemName) {
        if (itemName == null || itemName.isBlank()) {
            throw new DemoItemDomainException("名称不能为空");
        }
        if (itemName != null && itemName.length() > 64) {
            throw new DemoItemDomainException("名称长度不能超过 64");
        }
        this.itemName = itemName;
        touch();
    }

    /** 变更更新人 */
    public void changeUpdatedBy(String updatedBy) {
        if (updatedBy != null && updatedBy.length() > 64) {
            throw new DemoItemDomainException("更新人长度不能超过 64");
        }
        this.updatedBy = updatedBy;
        touch();
    }

    /** 任何可编辑字段变化后刷新更新时间 */
    private void touch() {
        this.updatedAt = Instant.now();
    }

    public DemoItemId id() {
        return id;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public Long demoId() {
        return demoId;
    }

    public String itemName() {
        return itemName;
    }

    public String createdBy() {
        return createdBy;
    }

    public String updatedBy() {
        return updatedBy;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof DemoItem other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
