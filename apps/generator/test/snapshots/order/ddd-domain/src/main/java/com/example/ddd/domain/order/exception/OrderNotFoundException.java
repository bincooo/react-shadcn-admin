package com.example.ddd.domain.order.exception;

import com.example.ddd.domain.shared.NotFoundException;

/**
 * 订单不存在领域异常（接口层映射为 404）。
 */
public class OrderNotFoundException extends NotFoundException {

    public OrderNotFoundException(Object identifier) {
        super("订单", identifier);
    }
}
