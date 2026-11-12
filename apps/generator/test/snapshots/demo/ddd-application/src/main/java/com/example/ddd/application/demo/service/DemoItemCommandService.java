package com.example.ddd.application.demo.service;

import com.example.ddd.application.demo.command.CreateDemoItemCommand;
import com.example.ddd.application.demo.command.UpdateDemoItemCommand;
import com.example.ddd.application.demo.dto.DemoItemDTO;
import com.example.ddd.application.demo.loader.DemoItemLoader;
import com.example.ddd.application.shared.DomainEventPublisher;
import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.model.DemoItemId;
import com.example.ddd.domain.demo.repository.DemoItemRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 演示明细应用服务（写侧用例编排）。
 *
 * <p>职责：加载聚合 → 调用聚合行为 → 持久化 → 发布领域事件。
 * 唯一性等需要跨聚合判断的规则在本层校验。</p>
 */
@Service
@Transactional(rollbackFor = Exception.class)
@AllArgsConstructor
public class DemoItemCommandService {

    private final DemoItemRepository demoItemRepository;
    private final DemoItemLoader demoItemLoader;
    private final DomainEventPublisher eventPublisher;

    /** 用例：创建演示明细 */
    public DemoItemDTO create(CreateDemoItemCommand command) {
        DemoItem saved = demoItemRepository.save(DemoItem.create(DemoItemId.next(), command.demoId(), command.itemName(), command.createdBy()));
        eventPublisher.publishFrom(saved);
        return DemoItemDTO.from(saved);
    }

    /** 用例：更新演示明细 */
    public DemoItemDTO update(String id, UpdateDemoItemCommand command) {
        DemoItem demoItem = demoItemLoader.requireById(id);
        demoItem.changeDemoId(command.demoId());
        demoItem.changeItemName(command.itemName());
        if (command.updatedBy() != null) {
            demoItem.changeUpdatedBy(command.updatedBy());
        }
        demoItemRepository.save(demoItem);
        return DemoItemDTO.from(demoItem);
    }

    /** 用例：删除演示明细 */
    public void delete(String id) {
        DemoItem demoItem = demoItemLoader.requireById(id);
        demoItemRepository.deleteById(demoItem.id());
    }
}
