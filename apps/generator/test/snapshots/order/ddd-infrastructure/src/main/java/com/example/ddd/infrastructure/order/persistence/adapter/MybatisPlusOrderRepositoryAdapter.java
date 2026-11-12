package com.example.ddd.infrastructure.order.persistence.adapter;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.model.OrderId;
import com.example.ddd.domain.order.repository.OrderRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import com.example.ddd.infrastructure.order.persistence.converter.OrderPersistenceConverter;
import com.example.ddd.infrastructure.order.persistence.mapper.OrderMapper;
import com.example.ddd.infrastructure.order.persistence.po.OrderPO;
import com.example.ddd.infrastructure.persistence.support.PageResults;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 订单仓储适配器（Adapter）：领域端口的 MyBatis-Plus 实现。
 *
 * <p>事务由调用方（应用服务的 {@code @Transactional}）声明；
 * 分页在 SQL 侧完成 limit/offset 与 count，不在内存切片。</p>
 */
@Repository
@AllArgsConstructor
public class MybatisPlusOrderRepositoryAdapter implements OrderRepository {

    private final OrderMapper orderMapper;

    @Override
    public Order findById(OrderId id) {
        OrderPO po = orderMapper.selectById(id.value());
        return po == null ? null : OrderPersistenceConverter.toDomain(po);
    }

    @Override
    public PageResult<Order> findPage(PageQuery query) {
        LambdaQueryWrapper<OrderPO> wrapper = new LambdaQueryWrapper<>();
        if (query.keyword() != null) {
            String like = query.keyword();
            wrapper.and(w -> w.like(OrderPO::getOrderNo, like)
                    .or().like(OrderPO::getCustomerName, like)
                    .or().like(OrderPO::getStatus, like)
                    .or().like(OrderPO::getRemark, like));
        }
        wrapper.orderByDesc(OrderPO::getCreatedAt);
        Page<OrderPO> page = orderMapper.selectPage(
                new Page<>(query.page(), query.size()), wrapper);
        return PageResults.toDomain(page, OrderPersistenceConverter::toDomain);
    }

    @Override
    public Order save(Order aggregate) {
        OrderPO po = OrderPersistenceConverter.toPO(aggregate);
        orderMapper.insertOrUpdate(po);
        return aggregate;
    }

    @Override
    public void deleteById(OrderId id) {
        orderMapper.deleteById(id.value());
    }

    @Override
    public boolean existsByOrderNo(String value) {
        return orderMapper.selectCount(new LambdaQueryWrapper<OrderPO>()
                .eq(OrderPO::getOrderNo, value)) > 0;
    }
}
