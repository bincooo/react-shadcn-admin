package com.example.ddd.application.order.command;

/**
 * 订单分页查询命令（由接口层请求转换）。
 *
 * <p>{@code keyword} 按可查询字段模糊匹配，null 或空白表示不过滤。</p>
 */
public record QueryOrderCommand(int page, int size, String keyword) {
}
