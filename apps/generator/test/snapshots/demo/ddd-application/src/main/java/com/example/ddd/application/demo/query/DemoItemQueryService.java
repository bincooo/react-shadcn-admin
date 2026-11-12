package com.example.ddd.application.demo.query;

import com.example.ddd.application.demo.command.QueryDemoItemCommand;
import com.example.ddd.application.demo.dto.DemoItemDTO;
import com.example.ddd.application.demo.loader.DemoItemLoader;
import com.example.ddd.application.shared.PageDTO;
import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.repository.DemoItemRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 演示明细查询服务（读侧用例，只读不开事务）。
 */
@Service
@Transactional(readOnly = true)
@AllArgsConstructor
public class DemoItemQueryService {

    private final DemoItemRepository demoItemRepository;
    private final DemoItemLoader demoItemLoader;

    /** 分页查询列表 */
    public PageDTO<DemoItemDTO> listPage(QueryDemoItemCommand query) {
        PageQuery pageQuery = new PageQuery(query.page(), query.size(), query.keyword());
        PageResult<DemoItem> result = demoItemRepository.findPage(pageQuery);
        return PageDTO.from(result, pageQuery, DemoItemDTO::from);
    }

    /** 按 ID 查询详情 */
    public DemoItemDTO get(String id) {
        return DemoItemDTO.from(demoItemLoader.requireById(id));
    }
}
