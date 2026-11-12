package com.example.ddd.application.demo.command;

/**
 * 演示分页查询命令（由接口层请求转换）。
 *
 * <p>{@code keyword} 按可查询字段模糊匹配，null 或空白表示不过滤。</p>
 */
public record QueryDemoCommand(int page, int size, String keyword) {
}
