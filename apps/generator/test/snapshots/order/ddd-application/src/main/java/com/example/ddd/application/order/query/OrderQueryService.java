package com.example.ddd.application.order.query;

import com.example.ddd.application.order.command.QueryOrderCommand;
import com.example.ddd.application.order.dto.OrderDTO;
import com.example.ddd.application.order.loader.OrderLoader;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.domain.order.model.Order;
import com.example.ddd.domain.order.repository.OrderRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 订单查询服务（读侧用例，只读不开事务）。
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class OrderQueryService {

    private final OrderRepository orderRepository;
    private final OrderLoader orderLoader;

    /** 分页查询列表 */
    public PageDTO<OrderDTO> listPage(QueryOrderCommand query) {
        PageQuery pageQuery = new PageQuery(query.page(), query.size(), query.keyword());
        PageResult<Order> result = orderRepository.findPage(pageQuery);
        return PageDTO.from(result, pageQuery, OrderDTO::from);
    }

    /** 按 ID 查询详情 */
    public OrderDTO get(String id) {
        return OrderDTO.from(orderLoader.requireById(id));
    }
}
