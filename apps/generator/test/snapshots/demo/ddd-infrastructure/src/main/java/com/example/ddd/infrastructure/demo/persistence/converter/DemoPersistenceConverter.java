package com.example.ddd.infrastructure.demo.persistence.converter;

import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.model.DemoId;
import com.example.ddd.infrastructure.demo.persistence.po.DemoPO;

/**
 * 演示 领域 ↔ PO 转换（防腐层）。
 *
 * <p>不可变字段经 {@link Demo#restore} 全参数重建，不走 setter / 反射。</p>
 */
public final class DemoPersistenceConverter {

    private DemoPersistenceConverter() {
    }

    /** 领域聚合 → PO */
    public static DemoPO toPO(Demo aggregate) {
        DemoPO po = new DemoPO();
        po.setId(aggregate.id().value());
        po.setCode(aggregate.code());
        po.setDescText(aggregate.descText());
        po.setQty(aggregate.qty());
        po.setAmount(aggregate.amount());
        po.setEnabled(aggregate.enabled());
        po.setBizDate(aggregate.bizDate());
        po.setCreatedTime(aggregate.createdTime());
        po.setStatus(aggregate.status());
        po.setExtra(aggregate.extra());
        po.setTraceId(aggregate.traceId());
        po.setCreatedDept(aggregate.createdDept());
        po.setCreatedAt(aggregate.createdAt());
        po.setCreatedBy(aggregate.createdBy());
        po.setUpdatedAt(aggregate.updatedAt());
        po.setUpdatedBy(aggregate.updatedBy());
        return po;
    }

    /** PO → 领域聚合（经 restore 工厂重建，不触发领域行为） */
    public static Demo toDomain(DemoPO po) {
        return Demo.restore(
                DemoId.of(po.getId()),
                po.getCode(),
                po.getDescText(),
                po.getQty(),
                po.getAmount(),
                po.getEnabled(),
                po.getBizDate(),
                po.getCreatedTime(),
                po.getStatus(),
                po.getExtra(),
                po.getTraceId(),
                po.getCreatedDept(),
                po.getCreatedAt(),
                po.getCreatedBy(),
                po.getUpdatedAt(),
                po.getUpdatedBy());
    }
}
