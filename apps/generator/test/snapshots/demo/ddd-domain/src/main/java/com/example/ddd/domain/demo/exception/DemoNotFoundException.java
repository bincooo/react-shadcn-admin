package com.example.ddd.domain.demo.exception;

import com.example.ddd.domain.shared.NotFoundException;

/**
 * 演示不存在领域异常（接口层映射为 404）。
 */
public class DemoNotFoundException extends NotFoundException {

    public DemoNotFoundException(Object identifier) {
        super("演示", identifier);
    }
}
