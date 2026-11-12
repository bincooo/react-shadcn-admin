package com.example.ddd.application.demo.service;

import com.example.ddd.application.demo.command.CreateDemoCommand;
import com.example.ddd.application.demo.command.UpdateDemoCommand;
import com.example.ddd.application.demo.dto.DemoDTO;
import com.example.ddd.application.demo.loader.DemoLoader;
import com.example.ddd.application.shared.DomainEventPublisher;
import com.example.ddd.domain.demo.exception.DemoDomainException;
import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.model.DemoId;
import com.example.ddd.domain.demo.repository.DemoRepository;
import java.util.Objects;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 演示应用服务（写侧用例编排）。
 *
 * <p>职责：加载聚合 → 调用聚合行为 → 持久化 → 发布领域事件。
 * 唯一性等需要跨聚合判断的规则在本层校验。</p>
 */
@Service
@Transactional(rollbackFor = Exception.class)
@AllArgsConstructor
public class DemoCommandService {

    private final DemoRepository demoRepository;
    private final DemoLoader demoLoader;
    private final DomainEventPublisher eventPublisher;

    /** 用例：创建演示 */
    public DemoDTO create(CreateDemoCommand command) {
        ensureCodeAvailable(command.code());
        Demo saved = demoRepository.save(Demo.create(DemoId.next(), command.code(), command.descText(), command.qty(), command.amount(), command.enabled(), command.bizDate(), command.createdTime(), command.status(), command.extra(), command.traceId(), command.createdDept(), command.createdBy()));
        eventPublisher.publishFrom(saved);
        return DemoDTO.from(saved);
    }

    /** 用例：更新演示 */
    public DemoDTO update(String id, UpdateDemoCommand command) {
        Demo demo = demoLoader.requireById(id);
        if (!Objects.equals(demo.code(), command.code())
                && command.code() != null
                && demoRepository.existsByCode(command.code())) {
            throw new DemoDomainException("编码已存在: " + command.code());
        }
        demo.changeCode(command.code());
        demo.changeDescText(command.descText());
        demo.changeQty(command.qty());
        demo.changeAmount(command.amount());
        demo.changeEnabled(command.enabled());
        demo.changeBizDate(command.bizDate());
        demo.changeCreatedTime(command.createdTime());
        demo.changeStatus(command.status());
        demo.changeExtra(command.extra());
        demo.changeTraceId(command.traceId());
        if (command.updatedBy() != null) {
            demo.changeUpdatedBy(command.updatedBy());
        }
        demoRepository.save(demo);
        return DemoDTO.from(demo);
    }

    /** 用例：删除演示 */
    public void delete(String id) {
        Demo demo = demoLoader.requireById(id);
        demoRepository.deleteById(demo.id());
    }

    /** 编码不能重复 */
    private void ensureCodeAvailable(String value) {
        if (value != null && demoRepository.existsByCode(value)) {
            throw new DemoDomainException("编码已存在: " + value);
        }
    }
}
