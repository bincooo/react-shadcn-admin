package com.example.ddd.interfaces.web.order.controller;

import com.example.ddd.application.order.command.CreateOrderCommand;
import com.example.ddd.application.order.command.QueryOrderCommand;
import com.example.ddd.application.order.command.UpdateOrderCommand;
import com.example.ddd.application.order.dto.OrderDTO;
import com.example.ddd.application.order.query.OrderQueryService;
import com.example.ddd.application.order.service.OrderCommandService;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.interfaces.web.order.request.CreateOrderRequest;
import com.example.ddd.interfaces.web.order.request.QueryOrderRequest;
import com.example.ddd.interfaces.web.order.request.UpdateOrderRequest;
import io.github.linpeilie.Converter;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单 REST 接口（接口层 / 驱动侧适配器）。
 *
 * <p>只做协议转换：HTTP 请求 → 命令/查询 → 应用服务，不含业务逻辑。</p>
 */
@RestController
@RequestMapping("/api/order")
@AllArgsConstructor
public class OrderController {

    private final OrderCommandService orderCommandService;
    private final OrderQueryService orderQueryService;
    private final Converter converter;

    /** 分页查询列表 */
    @GetMapping
    @PreAuthorize("@permission.has('system:order:query')")
    public PageDTO<OrderDTO> listPage(@ModelAttribute QueryOrderRequest request) {
        return orderQueryService.listPage(
                converter.convert(request, QueryOrderCommand.class));
    }

    /** 按 ID 查询详情 */
    @GetMapping("/{id}")
    @PreAuthorize("@permission.has('system:order:query')")
    public OrderDTO get(@PathVariable String id) {
        return orderQueryService.get(id);
    }

    /** 创建 */
    @PostMapping
    @PreAuthorize("@permission.has('system:order:create')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDTO create(@Valid @RequestBody CreateOrderRequest request) {
        return orderCommandService.create(
                converter.convert(request, CreateOrderCommand.class));
    }

    /** 更新 */
    @PutMapping("/{id}")
    @PreAuthorize("@permission.has('system:order:update')")
    public OrderDTO update(@PathVariable String id,
                                @Valid @RequestBody UpdateOrderRequest request) {
        return orderCommandService.update(id,
                converter.convert(request, UpdateOrderCommand.class));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("@permission.has('system:order:delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        orderCommandService.delete(id);
    }
}
