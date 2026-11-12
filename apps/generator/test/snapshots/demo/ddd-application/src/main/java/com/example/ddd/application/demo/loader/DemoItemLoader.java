package com.example.ddd.application.demo.loader;

import com.example.ddd.application.shared.Loaders;
import com.example.ddd.domain.demo.exception.DemoItemNotFoundException;
import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.model.DemoItemId;
import com.example.ddd.domain.demo.repository.DemoItemRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 演示明细加载器：按 ID 加载聚合，不存在时抛领域异常。
 */
@Component
@AllArgsConstructor
public class DemoItemLoader {

    private final DemoItemRepository demoItemRepository;

    /** 按 ID 加载；不存在时抛出 {@link DemoItemNotFoundException} */
    public DemoItem requireById(String id) {
        DemoItemId demoItemId = DemoItemId.parse(id);
        return Loaders.orThrow(demoItemRepository.findById(demoItemId),
                () -> new DemoItemNotFoundException(demoItemId));
    }
}
