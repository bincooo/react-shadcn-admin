package com.example.ddd.infrastructure.order.persistence.po;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.example.ddd.domain.order.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Data;

/**
 * 订单持久化对象（PO / Persistence Object）。
 *
 * <p>与领域模型严格隔离，表结构演进不会污染聚合；二者通过转换器互转。</p>
 */
@Data
@TableName("sys_order")
public class OrderPO {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private String customerName;

    private BigDecimal amount;

    private OrderStatus status;

    private String remark;

    private String createdDept;

    private Instant createdAt;

    private String createdBy;

    private Instant updatedAt;

    private String updatedBy;
}
