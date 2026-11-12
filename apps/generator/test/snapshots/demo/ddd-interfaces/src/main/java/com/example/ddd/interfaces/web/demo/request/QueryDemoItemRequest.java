package com.example.ddd.interfaces.web.demo.request;

import com.example.ddd.application.demo.command.QueryDemoItemCommand;
import io.github.linpeilie.annotations.AutoMapper;
import lombok.Data;

/**
 * 演示明细分页查询请求（查询参数绑定）。
 */
@Data
@AutoMapper(target = QueryDemoItemCommand.class, reverseConvertGenerate = false)
public class QueryDemoItemRequest {

    private int page = 1;
    private int size = 10;
    private String keyword;
}
