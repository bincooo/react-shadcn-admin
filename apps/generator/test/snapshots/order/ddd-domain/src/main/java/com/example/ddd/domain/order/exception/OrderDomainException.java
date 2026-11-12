package com.example.ddd.domain.order.exception;

import com.example.ddd.domain.shared.DomainException;

/**
 * 订单领域规则违反（唯一键重复、空字段、非法状态等业务冲突）。
 *
 * <p>接口层通常映射为 409；参数格式问题仍使用 {@code IllegalArgumentException}（映射 400）。</p>
 */
public class OrderDomainException extends DomainException {

    public OrderDomainException(String message) {
        super(message);
    }
}
