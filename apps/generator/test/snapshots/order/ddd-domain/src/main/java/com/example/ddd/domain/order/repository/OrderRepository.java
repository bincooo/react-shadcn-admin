package com.example.ddd.domain.order.repository;

import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderId;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;

/**
 * 订单仓储端口（Port）。
 *
 * <p>领域层只定义契约，具体实现位于 infrastructure 层；
 * 不存在返回 null，由应用层 Loader 抛异常。</p>
 */
public interface OrderRepository {

    /** 按 ID 查询；不存在时返回 null */
    Order findById(OrderId id);

    /** 分页查询，返回当前页记录与总数 */
    PageResult<Order> findPage(PageQuery query);

    /** 保存（新增或更新） */
    Order save(Order aggregate);

    /** 按 ID 删除 */
    void deleteById(OrderId id);

    /** 订单号是否已存在 */
    boolean existsByOrderNo(String value);
}
