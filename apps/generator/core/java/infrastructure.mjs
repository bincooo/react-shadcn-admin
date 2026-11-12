/**
 * 基础设施层模板：PO、Mapper、领域 ↔ PO 转换器、MyBatis-Plus 仓储适配器。
 * 这里只组装 import 列表并渲染模板，具体文本由 templates/backend/java/infrastructure/*.ftl 决定。
 */
import { typeImports } from '../java-utils.mjs'
import { uniqueImports } from '../model.mjs'
import { renderJava } from './template.mjs'

function generatePo(ctx) {
  return renderJava(ctx, 'backend/java/infrastructure/po.ftl', {
    imports: uniqueImports([
      'com.baomidou.mybatisplus.annotation.IdType',
      'com.baomidou.mybatisplus.annotation.TableId',
      'com.baomidou.mybatisplus.annotation.TableName',
      'lombok.Data',
      ...typeImports(ctx.definition.columns, ctx),
    ]),
  })
}

function generateMapper(ctx) {
  return renderJava(ctx, 'backend/java/infrastructure/mapper.ftl', {
    imports: uniqueImports([
      'com.baomidou.mybatisplus.core.mapper.BaseMapper',
      `${ctx.pkgs.infrastructurePo}.${ctx.entity}PO`,
    ]),
  })
}

function generateConverter(ctx) {
  const { entity, entityId, pkgs } = ctx
  return renderJava(ctx, 'backend/java/infrastructure/converter.ftl', {
    imports: uniqueImports([
      `${pkgs.domainModel}.${entity}`,
      `${pkgs.domainModel}.${entityId}`,
      `${pkgs.infrastructurePo}.${entity}PO`,
    ]),
  })
}

function generateAdapter(ctx) {
  const { entity, entityId, pkgs, uniqueColumns } = ctx
  return renderJava(ctx, 'backend/java/infrastructure/adapter.ftl', {
    imports: uniqueImports([
      'com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper',
      'com.baomidou.mybatisplus.extension.plugins.pagination.Page',
      `${pkgs.domainModel}.${entity}`,
      `${pkgs.domainModel}.${entityId}`,
      `${pkgs.domainRepository}.${entity}Repository`,
      `${pkgs.sharedDomain}.PageQuery`,
      `${pkgs.sharedDomain}.PageResult`,
      `${pkgs.infrastructureConverter}.${entity}PersistenceConverter`,
      `${pkgs.infrastructureMapper}.${entity}Mapper`,
      `${pkgs.infrastructurePo}.${entity}PO`,
      `${pkgs.sharedInfrastructure}.PageResults`,
      'org.springframework.stereotype.Repository',
      'lombok.AllArgsConstructor',
      ...typeImports(uniqueColumns, ctx),
    ]),
    mapperField: `${ctx.entityVar}Mapper`,
  })
}

export function generateInfrastructureFiles(ctx) {
  return [
    {
      pkg: ctx.pkgs.infrastructurePo,
      file: `${ctx.entity}PO.java`,
      content: generatePo(ctx),
    },
    {
      pkg: ctx.pkgs.infrastructureMapper,
      file: `${ctx.entity}Mapper.java`,
      content: generateMapper(ctx),
    },
    {
      pkg: ctx.pkgs.infrastructureConverter,
      file: `${ctx.entity}PersistenceConverter.java`,
      content: generateConverter(ctx),
    },
    {
      pkg: ctx.pkgs.infrastructureAdapter,
      file: `MybatisPlus${ctx.entity}RepositoryAdapter.java`,
      content: generateAdapter(ctx),
    },
  ]
}
