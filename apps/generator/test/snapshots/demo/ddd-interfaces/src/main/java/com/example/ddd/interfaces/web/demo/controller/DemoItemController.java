package com.example.ddd.interfaces.web.demo.controller;

import com.example.ddd.application.demo.command.CreateDemoItemCommand;
import com.example.ddd.application.demo.command.QueryDemoItemCommand;
import com.example.ddd.application.demo.command.UpdateDemoItemCommand;
import com.example.ddd.application.demo.dto.DemoItemDTO;
import com.example.ddd.application.demo.query.DemoItemQueryService;
import com.example.ddd.application.demo.service.DemoItemCommandService;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.interfaces.web.demo.request.CreateDemoItemRequest;
import com.example.ddd.interfaces.web.demo.request.QueryDemoItemRequest;
import com.example.ddd.interfaces.web.demo.request.UpdateDemoItemRequest;
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
 * 演示明细 REST 接口（接口层 / 驱动侧适配器）。
 *
 * <p>只做协议转换：HTTP 请求 → 命令/查询 → 应用服务，不含业务逻辑。</p>
 */
@RestController
@RequestMapping("/api/demoitem")
@AllArgsConstructor
public class DemoItemController {

    private final DemoItemCommandService demoItemCommandService;
    private final DemoItemQueryService demoItemQueryService;
    private final Converter converter;

    /** 分页查询列表 */
    @GetMapping
    @PreAuthorize("@permission.has('system:demo:query')")
    public PageDTO<DemoItemDTO> listPage(@ModelAttribute QueryDemoItemRequest request) {
        return demoItemQueryService.listPage(
                converter.convert(request, QueryDemoItemCommand.class));
    }

    /** 按 ID 查询详情 */
    @GetMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:query')")
    public DemoItemDTO get(@PathVariable String id) {
        return demoItemQueryService.get(id);
    }

    /** 创建 */
    @PostMapping
    @PreAuthorize("@permission.has('system:demo:create')")
    @ResponseStatus(HttpStatus.CREATED)
    public DemoItemDTO create(@Valid @RequestBody CreateDemoItemRequest request) {
        return demoItemCommandService.create(
                converter.convert(request, CreateDemoItemCommand.class));
    }

    /** 更新 */
    @PutMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:update')")
    public DemoItemDTO update(@PathVariable String id,
                                @Valid @RequestBody UpdateDemoItemRequest request) {
        return demoItemCommandService.update(id,
                converter.convert(request, UpdateDemoItemCommand.class));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @PreAuthorize("@permission.has('system:demo:delete')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        demoItemCommandService.delete(id);
    }
}
