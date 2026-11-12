package com.example.ddd.interfaces.web.order.request;

import com.example.ddd.application.order.command.QueryOrderCommand;
import io.github.linpeilie.annotations.AutoMapper;
import lombok.Data;

/**
 * 订单分页查询请求（查询参数绑定）。
 */
@Data
@AutoMapper(target = QueryOrderCommand.class, reverseConvertGenerate = false)
public class QueryOrderRequest {

    private int page = 1;
    private int size = 10;
    private String keyword;
}
