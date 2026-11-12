package com.example.ddd.application.demo.loader;

import com.example.ddd.application.shared.Loaders;
import com.example.ddd.domain.demo.exception.DemoNotFoundException;
import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.model.DemoId;
import com.example.ddd.domain.demo.repository.DemoRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 演示加载器：按 ID 加载聚合，不存在时抛领域异常。
 */
@Component
@AllArgsConstructor
public class DemoLoader {

    private final DemoRepository demoRepository;

    /** 按 ID 加载；不存在时抛出 {@link DemoNotFoundException} */
    public Demo requireById(String id) {
        DemoId demoId = DemoId.parse(id);
        return Loaders.orThrow(demoRepository.findById(demoId),
                () -> new DemoNotFoundException(demoId));
    }
}
