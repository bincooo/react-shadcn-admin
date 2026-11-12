package com.example.ddd.application.demo.query;

import com.example.ddd.application.demo.command.QueryDemoCommand;
import com.example.ddd.application.demo.dto.DemoDTO;
import com.example.ddd.application.demo.loader.DemoLoader;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.repository.DemoRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 演示查询服务（读侧用例，只读不开事务）。
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class DemoQueryService {

    private final DemoRepository demoRepository;
    private final DemoLoader demoLoader;

    /** 分页查询列表 */
    public PageDTO<DemoDTO> listPage(QueryDemoCommand query) {
        PageQuery pageQuery = new PageQuery(query.page(), query.size(), query.keyword());
        PageResult<Demo> result = demoRepository.findPage(pageQuery);
        return PageDTO.from(result, pageQuery, DemoDTO::from);
    }

    /** 按 ID 查询详情 */
    public DemoDTO get(String id) {
        return DemoDTO.from(demoLoader.requireById(id));
    }
}
