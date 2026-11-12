package com.example.ddd.infrastructure.demo.persistence.converter;

import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.model.DemoItemId;
import com.example.ddd.infrastructure.demo.persistence.po.DemoItemPO;

/**
 * 演示明细 领域 ↔ PO 转换（防腐层）。
 *
 * <p>不可变字段经 {@link DemoItem#restore} 全参数重建，不走 setter / 反射。</p>
 */
public final class DemoItemPersistenceConverter {

    private DemoItemPersistenceConverter() {
    }

    /** 领域聚合 → PO */
    public static DemoItemPO toPO(DemoItem aggregate) {
        DemoItemPO po = new DemoItemPO();
        po.setId(aggregate.id().value());
        po.setDemoId(aggregate.demoId());
        po.setItemName(aggregate.itemName());
        po.setCreatedAt(aggregate.createdAt());
        po.setCreatedBy(aggregate.createdBy());
        po.setUpdatedAt(aggregate.updatedAt());
        po.setUpdatedBy(aggregate.updatedBy());
        return po;
    }

    /** PO → 领域聚合（经 restore 工厂重建，不触发领域行为） */
    public static DemoItem toDomain(DemoItemPO po) {
        return DemoItem.restore(
                DemoItemId.of(po.getId()),
                po.getDemoId(),
                po.getItemName(),
                po.getCreatedAt(),
                po.getCreatedBy(),
                po.getUpdatedAt(),
                po.getUpdatedBy());
    }
}
