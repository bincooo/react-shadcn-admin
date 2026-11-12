package com.example.ddd.interfaces.web.demo.controller;

import com.example.ddd.application.demo.command.CreateDemoCommand;
import com.example.ddd.application.demo.command.QueryDemoCommand;
import com.example.ddd.application.demo.command.UpdateDemoCommand;
import com.example.ddd.application.demo.dto.DemoDTO;
import com.example.ddd.application.demo.query.DemoQueryService;
import com.example.ddd.application.demo.service.DemoCommandService;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.interfaces.web.demo.request.CreateDemoRequest;
import com.example.ddd.interfaces.web.demo.request.QueryDemoRequest;
import com.example.ddd.interfaces.web.demo.request.UpdateDemoRequest;
import io.github.linpeilie.Converter;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 演示 REST 接口（接口层 / 驱动侧适配器）。
 *
 * <p>只做协议转换：HTTP 请求 → 命令/查询 → 应用服务，不含业务逻辑。</p>
 */
@RestController
@RequestMapping("/api/demo")
@AllArgsConstructor
public class DemoController {

    private final DemoCommandService demoCommandService;
    private final DemoQueryService demoQueryService;
    private final Converter converter;

    /** 分页查询列表 */
    @GetMapping
    @PreAuthorize("@permission.has('system:demo:query')")
    public PageDTO<DemoDTO> listPage(@ModelAttribute QueryDemoRequest request) {
        return demoQueryService.listPage(
                converter.convert(request, QueryDemoCommand.class));
    }

    /** 按 ID 查询详情 */
    @GetMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:query')")
    public DemoDTO get(@PathVariable String id) {
        return demoQueryService.get(id);
    }

    /** 创建 */
    @PostMapping
    @PreAuthorize("@permission.has('system:demo:create')")
    @ResponseStatus(HttpStatus.CREATED)
    public DemoDTO create(@Valid @RequestBody CreateDemoRequest request) {
        return demoCommandService.create(
                converter.convert(request, CreateDemoCommand.class));
    }

    /** 更新 */
    @PutMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:update')")
    public DemoDTO update(@PathVariable String id,
                                @Valid @RequestBody UpdateDemoRequest request) {
        return demoCommandService.update(id,
                converter.convert(request, UpdateDemoCommand.class));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        demoCommandService.delete(id);
    }
}
