package com.example.ddd.infrastructure.demo.persistence.adapter;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.ddd.domain.demo.model.Demo;
import com.example.ddd.domain.demo.model.DemoId;
import com.example.ddd.domain.demo.repository.DemoRepository;
import com.example.ddd.domain.shared.PageQuery;
import com.example.ddd.domain.shared.PageResult;
import com.example.ddd.infrastructure.demo.persistence.converter.DemoPersistenceConverter;
import com.example.ddd.infrastructure.demo.persistence.mapper.DemoMapper;
import com.example.ddd.infrastructure.demo.persistence.po.DemoPO;
import com.example.ddd.infrastructure.persistence.support.PageResults;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * 演示仓储适配器（Adapter）：领域端口的 MyBatis-Plus 实现。
 *
 * <p>事务由调用方（应用服务的 {@code @Transactional}）声明；
 * 分页在 SQL 侧完成 limit/offset 与 count，不在内存切片。</p>
 */
@Repository
@AllArgsConstructor
public class MybatisPlusDemoRepositoryAdapter implements DemoRepository {

    private final DemoMapper demoMapper;

    @Override
    public Demo findById(DemoId id) {
        DemoPO po = demoMapper.selectById(id.value());
        return po == null ? null : DemoPersistenceConverter.toDomain(po);
    }

    @Override
    public PageResult<Demo> findPage(PageQuery query) {
        LambdaQueryWrapper<DemoPO> wrapper = new LambdaQueryWrapper<>();
        if (query.keyword() != null) {
            String like = query.keyword();
            wrapper.and(w -> w.like(DemoPO::getCode, like)
                    .or().like(DemoPO::getDescText, like)
                    .or().like(DemoPO::getStatus, like)
                    .or().like(DemoPO::getTraceId, like));
        }
        wrapper.orderByDesc(DemoPO::getCreatedAt);
        Page<DemoPO> page = demoMapper.selectPage(
                new Page<>(query.page(), query.size()), wrapper);
        return PageResults.toDomain(page, DemoPersistenceConverter::toDomain);
    }

    @Override
    public Demo save(Demo aggregate) {
        DemoPO po = DemoPersistenceConverter.toPO(aggregate);
        demoMapper.insertOrUpdate(po);
        return aggregate;
    }

    @Override
    public void deleteById(DemoId id) {
        demoMapper.deleteById(id.value());
    }

    @Override
    public boolean existsByCode(String value) {
        return demoMapper.selectCount(new LambdaQueryWrapper<DemoPO>()
                .eq(DemoPO::getCode, value)) > 0;
    }
}
