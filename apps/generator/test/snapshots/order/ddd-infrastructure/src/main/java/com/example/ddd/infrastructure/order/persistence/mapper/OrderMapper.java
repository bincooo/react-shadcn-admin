package com.example.ddd.infrastructure.order.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.ddd.infrastructure.order.persistence.po.OrderPO;

/**
 * MyBatis-Plus Mapper：sys_order 表。
 *
 * <p>基础 CRUD 由 BaseMapper 直接提供，无需 XML。</p>
 */
public interface OrderMapper extends BaseMapper<OrderPO> {
}
