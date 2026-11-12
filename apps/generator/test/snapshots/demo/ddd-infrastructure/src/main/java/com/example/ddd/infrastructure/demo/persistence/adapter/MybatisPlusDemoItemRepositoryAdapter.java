package com.example.ddd.infrastructure.demo.persistence.adapter;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.ddd.domain.demo.model.DemoItem;
import com.example.ddd.domain.demo.model.DemoItemId;
import com.example.ddd.domain.demo.repository.DemoItemRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import com.example.ddd.infrastructure.demo.persistence.converter.DemoItemPersistenceConverter;
import com.example.ddd.infrastructure.demo.persistence.mapper.DemoItemMapper;
import com.example.ddd.infrastructure.demo.persistence.po.DemoItemPO;
import com.example.ddd.infrastructure.persistence.support.PageResults;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 演示明细仓储适配器（Adapter）：领域端口的 MyBatis-Plus 实现。
 *
 * <p>事务由调用方（应用服务的 {@code @Transactional}）声明；
 * 分页在 SQL 侧完成 limit/offset 与 count，不在内存切片。</p>
 */
@Repository
@AllArgsConstructor
public class MybatisPlusDemoItemRepositoryAdapter implements DemoItemRepository {

    private final DemoItemMapper demoItemMapper;

    @Override
    public DemoItem findById(DemoItemId id) {
        DemoItemPO po = demoItemMapper.selectById(id.value());
        return po == null ? null : DemoItemPersistenceConverter.toDomain(po);
    }

    @Override
    public PageResult<DemoItem> findPage(PageQuery query) {
        LambdaQueryWrapper<DemoItemPO> wrapper = new LambdaQueryWrapper<>();
        if (query.keyword() != null) {
            String like = query.keyword();
            wrapper.and(w -> w.like(DemoItemPO::getItemName, like));
        }
        wrapper.orderByDesc(DemoItemPO::getCreatedAt);
        Page<DemoItemPO> page = demoItemMapper.selectPage(
                new Page<>(query.page(), query.size()), wrapper);
        return PageResults.toDomain(page, DemoItemPersistenceConverter::toDomain);
    }

    @Override
    public DemoItem save(DemoItem aggregate) {
        DemoItemPO po = DemoItemPersistenceConverter.toPO(aggregate);
        demoItemMapper.insertOrUpdate(po);
        return aggregate;
    }

    @Override
    public void deleteById(DemoItemId id) {
        demoItemMapper.deleteById(id.value());
    }
}
