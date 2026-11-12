package com.example.ddd.domain.demo.exception;

import com.example.ddd.domain.shared.NotFoundException;

/**
 * 演示明细不存在领域异常（接口层映射为 404）。
 */
public class DemoItemNotFoundException extends NotFoundException {

    public DemoItemNotFoundException(Object identifier) {
        super("演示明细", identifier);
    }
}
