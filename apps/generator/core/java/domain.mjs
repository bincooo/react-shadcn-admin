/** 领域层模板：聚合根、ID 值对象、枚举、事件、异常、仓储端口。 */
import { escapeJavaString, typeImports } from '../java-utils.mjs'
import { buildModel, uniqueImports } from '../model.mjs'
import { renderJava } from './template.mjs'

function generateId(ctx) {
  return renderJava(ctx, 'backend/java/domain/id.ftl', {
    imports: uniqueImports([
      `${ctx.pkgs.sharedDomain}.SnowflakeIdGenerator`,
      'java.util.Objects',
    ]),
  })
}

function generateEnum(ctx, column) {
  const { columns } = buildModel(ctx)
  return renderJava(ctx, 'backend/java/domain/enum.ftl', {
    column: columns.find((item) => item.id === column.id),
  })
}

function generateEvent(ctx) {
  return renderJava(ctx, 'backend/java/domain/event.ftl', {
    imports: uniqueImports([
      `${ctx.pkgs.sharedDomain}.DomainEvent`,
      'java.time.Instant',
    ]),
  })
}

function generateExceptions(ctx) {
  const { definition } = ctx
  const { domainException, notFoundException } = buildModel(ctx)
  return [
    {
      pkg: ctx.pkgs.domainException,
      file: `${domainException}.java`,
      content: renderJava(ctx, 'backend/java/domain/domain-exception.ftl', {
        domainException,
        imports: uniqueImports([`${ctx.pkgs.sharedDomain}.DomainException`]),
      }),
    },
    {
      pkg: ctx.pkgs.domainException,
      file: `${notFoundException}.java`,
      content: renderJava(ctx, 'backend/java/domain/not-found-exception.ftl', {
        notFoundException,
        imports: uniqueImports([`${ctx.pkgs.sharedDomain}.NotFoundException`]),
        displayNameEscaped: escapeJavaString(definition.displayName),
      }),
    },
  ]
}

function generateAggregate(ctx) {
  const { definition } = ctx
  const imports = [
    `${ctx.pkgs.sharedDomain}.AggregateRoot`,
    'java.time.Instant',
    'java.util.Objects',
    `${ctx.pkgs.domainEvent}.${ctx.entity}CreatedEvent`,
    `${ctx.pkgs.domainException}.${ctx.entity}DomainException`,
    ...typeImports(definition.columns, ctx),
  ]
  return renderJava(ctx, 'backend/java/domain/aggregate.ftl', {
    imports: uniqueImports(imports),
  })
}

function generateRepository(ctx) {
  const { entity, entityId, pkgs, uniqueColumns } = ctx
  return renderJava(ctx, 'backend/java/domain/repository.ftl', {
    imports: uniqueImports([
      `${pkgs.sharedDomain}.PageQuery`,
      `${pkgs.sharedDomain}.PageResult`,
      `${pkgs.domainModel}.${entity}`,
      `${pkgs.domainModel}.${entityId}`,
      ...typeImports(uniqueColumns, ctx),
    ]),
  })
}

export function generateDomainFiles(ctx) {
  const files = [
    {
      pkg: ctx.pkgs.domainModel,
      file: `${ctx.entityId}.java`,
      content: generateId(ctx),
    },
    {
      pkg: ctx.pkgs.domainModel,
      file: `${ctx.entity}.java`,
      content: generateAggregate(ctx),
    },
    {
      pkg: ctx.pkgs.domainEvent,
      file: `${ctx.entity}CreatedEvent.java`,
      content: generateEvent(ctx),
    },
    ...generateExceptions(ctx),
    {
      pkg: ctx.pkgs.domainRepository,
      file: `${ctx.entity}Repository.java`,
      content: generateRepository(ctx),
    },
  ]

  const enumColumns = ctx.definition.columns.filter(
    (column) => column.type === 'enum',
  )
  for (const column of enumColumns) {
    files.push({
      pkg: ctx.pkgs.domainModel,
      file: `${ctx.enumNames.get(column.id)}.java`,
      content: generateEnum(ctx, column),
    })
  }
  return files
}
