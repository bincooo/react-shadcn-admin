package com.example.ddd.interfaces.web.order.request;

import com.example.ddd.application.order.command.CreateOrderCommand;
import com.example.ddd.domain.order.model.OrderStatus;
import io.github.linpeilie.annotations.AutoMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * 创建订单请求体（Bean Validation 校验）。
 */
@AutoMapper(target = CreateOrderCommand.class, reverseConvertGenerate = false)
public record CreateOrderRequest(
        @NotBlank(message = "订单号不能为空")
        @Size(max = 32, message = "订单号长度不能超过 32")
        String orderNo,
        @NotBlank(message = "客户名称不能为空")
        @Size(max = 64, message = "客户名称长度不能超过 64")
        String customerName,
        @NotNull(message = "订单金额不能为空")
        BigDecimal amount,
        @NotNull(message = "订单状态不能为空")
        OrderStatus status,
        String remark,
        @Size(max = 128, message = "创建部门长度不能超过 128")
        String createdDept,
        @Size(max = 64, message = "创建人长度不能超过 64")
        String createdBy
) {
}
