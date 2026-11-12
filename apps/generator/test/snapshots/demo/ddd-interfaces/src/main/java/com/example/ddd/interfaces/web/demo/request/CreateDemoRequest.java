package com.example.ddd.interfaces.web.demo.request;

import com.example.ddd.application.demo.command.CreateDemoCommand;
import com.example.ddd.domain.demo.model.DemoStatus;
import io.github.linpeilie.annotations.AutoMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * 创建演示请求体（Bean Validation 校验）。
 */
@AutoMapper(target = CreateDemoCommand.class, reverseConvertGenerate = false)
public record CreateDemoRequest(
        @NotBlank(message = "编码不能为空")
        @Size(max = 32, message = "编码长度不能超过 32")
        String code,
        String descText,
        @NotNull(message = "数量不能为空")
        Integer qty,
        BigDecimal amount,
        @NotNull(message = "启用不能为空")
        Boolean enabled,
        LocalDate bizDate,
        Instant createdTime,
        @NotNull(message = "状态不能为空")
        DemoStatus status,
        String extra,
        @Size(max = 36, message = "追踪号长度不能超过 36")
        String traceId,
        @Size(max = 128, message = "创建部门长度不能超过 128")
        String createdDept,
        @Size(max = 64, message = "创建人长度不能超过 64")
        String createdBy
) {
}
