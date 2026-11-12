package com.example.ddd.domain.demo.repository;

import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.model.DemoItemId;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;

/**
 * 演示明细仓储端口（Port）。
 *
 * <p>领域层只定义契约，具体实现位于 infrastructure 层；
 * 不存在返回 null，由应用层 Loader 抛异常。</p>
 */
public interface DemoItemRepository {

    /** 按 ID 查询；不存在时返回 null */
    DemoItem findById(DemoItemId id);

    /** 分页查询，返回当前页记录与总数 */
    PageResult<DemoItem> findPage(PageQuery query);

    /** 保存（新增或更新） */
    DemoItem save(DemoItem aggregate);

    /** 按 ID 删除 */
    void deleteById(DemoItemId id);
}
