package com.example.ddd.interfaces.web.demo.request;

import com.example.ddd.application.demo.command.CreateDemoItemCommand;
import io.github.linpeilie.annotations.AutoMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 创建演示明细请求体（Bean Validation 校验）。
 */
@AutoMapper(target = CreateDemoItemCommand.class, reverseConvertGenerate = false)
public record CreateDemoItemRequest(
        @NotNull(message = "主表ID不能为空")
        Long demoId,
        @NotBlank(message = "名称不能为空")
        @Size(max = 64, message = "名称长度不能超过 64")
        String itemName,
        @Size(max = 64, message = "创建人长度不能超过 64")
        String createdBy
) {
}
