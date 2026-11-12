package com.example.ddd.infrastructure.demo.persistence.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.Instant;
import lombok.Data;

/**
 * 演示明细持久化对象（PO / Persistence Object）。
 *
 * <p>与领域模型严格隔离，表结构演进不会污染聚合；二者通过转换器互转。</p>
 */
@Data
@TableName("sys_demo_item")
public class DemoItemPO {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long demoId;

    private String itemName;

    private Instant createdAt;

    private String createdBy;

    private Instant updatedAt;

    private String updatedBy;
}
