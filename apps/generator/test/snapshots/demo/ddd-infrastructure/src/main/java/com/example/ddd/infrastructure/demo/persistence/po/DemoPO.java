package com.example.ddd.infrastructure.demo.persistence.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.example.ddd.domain.demo.model.DemoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Data;

/**
 * 演示持久化对象（PO / Persistence Object）。
 *
 * <p>与领域模型严格隔离，表结构演进不会污染聚合；二者通过转换器互转。</p>
 */
@Data
@TableName("sys_demo")
public class DemoPO {

    @TableId(type = IdType.AUTO)
    private Long id;

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

    private Instant createdAt;

    private String createdBy;

    private Instant updatedAt;

    private String updatedBy;
}
