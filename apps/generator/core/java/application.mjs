/** 应用层模板：命令、查询、DTO、Loader、命令服务、查询服务。 */
import {
  columnLabel,
  escapeJavaString,
  isTextLike,
  typeImports,
} from '../java-utils.mjs'
import { uniqueImports } from '../model.mjs'
import { renderJava } from './template.mjs'

/** 查询 / 命令服务共用的 Spring 与 Lombok import */
const SERVICE_IMPORTS = [
  'org.springframework.stereotype.Service',
  'org.springframework.transaction.annotation.Transactional',
  'lombok.AllArgsConstructor',
]

/** 创建 / 更新两类入参共用的差异：字段集与中文标签 */
function inputSpec(ctx, kind) {
  const isCreate = kind === 'Create'
  return {
    isCreate,
    kindLabel: isCreate ? '创建' : '更新',
    columns: isCreate ? ctx.createColumns : ctx.editableColumns,
  }
}

function generateCommand(ctx, kind) {
  const { isCreate, kindLabel, columns } = inputSpec(ctx, kind)
  return renderJava(ctx, 'backend/java/application/command.ftl', {
    className: `${kind}${ctx.entity}Command`,
    kindLabel,
    isCreate,
    commandColumns: columns.map((column) => ({
      ...column,
      javaType: ctx.javaTypeOf(column),
    })),
    imports: uniqueImports(typeImports(columns, ctx)),
  })
}

function generateQueryCommand(ctx) {
  return renderJava(ctx, 'backend/java/application/query-command.ftl')
}

function generateDto(ctx) {
  const { entity, definition } = ctx
  const imports = [
    `${ctx.pkgs.domainModel}.${entity}`,
    ...typeImports(definition.columns, ctx),
    'tools.jackson.databind.annotation.JsonSerialize',
    'tools.jackson.databind.ser.std.ToStringSerializer',
  ]
  return renderJava(ctx, 'backend/java/application/dto.ftl', {
    imports: uniqueImports(imports),
  })
}

function generateLoader(ctx) {
  const { entity, entityId, pkgs } = ctx
  return renderJava(ctx, 'backend/java/application/loader.ftl', {
    imports: uniqueImports([
      `${pkgs.sharedApplication}.Loaders`,
      `${pkgs.domainException}.${entity}NotFoundException`,
      `${pkgs.domainModel}.${entity}`,
      `${pkgs.domainModel}.${entityId}`,
      `${pkgs.domainRepository}.${entity}Repository`,
      'org.springframework.stereotype.Component',
      'lombok.AllArgsConstructor',
    ]),
    repositoryField: `${ctx.entityVar}Repository`,
  })
}

function generateQueryService(ctx) {
  const { entity, pkgs } = ctx
  return renderJava(ctx, 'backend/java/application/query-service.ftl', {
    imports: uniqueImports([
      `${pkgs.applicationCommand}.Query${entity}Command`,
      `${pkgs.applicationDto}.${entity}DTO`,
      `${pkgs.sharedApplication}.PageDTO`,
      `${pkgs.domainModel}.${entity}`,
      `${pkgs.domainRepository}.${entity}Repository`,
      `${pkgs.sharedDomain}.PageQuery`,
      `${pkgs.sharedDomain}.PageResult`,
      `${pkgs.applicationLoader}.${entity}Loader`,
      ...SERVICE_IMPORTS,
    ]),
  })
}

function generateCommandService(ctx) {
  const { entity, entityId, pkgs, uniqueColumns } = ctx
  const imports = [
    `${pkgs.applicationCommand}.Create${entity}Command`,
    `${pkgs.applicationCommand}.Update${entity}Command`,
    `${pkgs.applicationDto}.${entity}DTO`,
    `${pkgs.applicationLoader}.${entity}Loader`,
    `${pkgs.sharedApplication}.DomainEventPublisher`,
    `${pkgs.domainModel}.${entity}`,
    `${pkgs.domainModel}.${entityId}`,
    `${pkgs.domainRepository}.${entity}Repository`,
    ...SERVICE_IMPORTS,
    ...typeImports(uniqueColumns, ctx),
  ]
  if (uniqueColumns.length > 0) {
    imports.push(
      `${pkgs.domainException}.${ctx.entity}DomainException`,
      'java.util.Objects',
    )
  }
  return renderJava(ctx, 'backend/java/application/command-service.ftl', {
    imports: uniqueImports(imports),
  })
}

/** Bean Validation 注解与对应 import，模板直接遍历 */
function validationMeta(column) {
  const label = columnLabel(column)
  const annotations = []
  const imports = []
  if (!column.nullable) {
    if (isTextLike(column)) {
      annotations.push(
        `@NotBlank(message = ${escapeJavaString(`${label}不能为空`)})`,
      )
      imports.push('jakarta.validation.constraints.NotBlank')
    } else {
      annotations.push(
        `@NotNull(message = ${escapeJavaString(`${label}不能为空`)})`,
      )
      imports.push('jakarta.validation.constraints.NotNull')
    }
  }
  if (isTextLike(column) && column.length) {
    annotations.push(
      `@Size(max = ${column.length}, message = ${escapeJavaString(`${label}长度不能超过 ${column.length}`)})`,
    )
    imports.push('jakarta.validation.constraints.Size')
  }
  return { annotations, imports }
}

function generateRequest(ctx, kind) {
  const { entity, pkgs } = ctx
  const { kindLabel, columns } = inputSpec(ctx, kind)
  const imports = typeImports(columns, ctx)
  const requestColumns = columns.map((column) => {
    const validation = validationMeta(column)
    imports.push(...validation.imports)
    return {
      ...column,
      javaType: ctx.javaTypeOf(column),
      validationAnnotations: validation.annotations,
    }
  })
  imports.push(
    `${pkgs.applicationCommand}.${kind}${entity}Command`,
    'io.github.linpeilie.annotations.AutoMapper',
  )
  return renderJava(ctx, 'backend/java/application/request.ftl', {
    className: `${kind}${entity}Request`,
    commandClass: `${kind}${entity}Command`,
    kindLabel,
    imports: uniqueImports(imports),
    requestColumns,
  })
}

function generateQueryRequest(ctx) {
  const { entity, pkgs } = ctx
  return renderJava(ctx, 'backend/java/application/query-request.ftl', {
    imports: uniqueImports([
      `${pkgs.applicationCommand}.Query${entity}Command`,
      'io.github.linpeilie.annotations.AutoMapper',
      'lombok.Data',
    ]),
  })
}

function generateController(ctx) {
  const { entity, pkgs, definition } = ctx
  const imports = [
    `${pkgs.applicationCommand}.Create${entity}Command`,
    `${pkgs.applicationCommand}.Query${entity}Command`,
    `${pkgs.applicationCommand}.Update${entity}Command`,
    `${pkgs.applicationDto}.${entity}DTO`,
    `${pkgs.applicationQuery}.${entity}QueryService`,
    `${pkgs.applicationService}.${entity}CommandService`,
    `${pkgs.sharedApplication}.PageDTO`,
    `${pkgs.webRequest}.Create${entity}Request`,
    `${pkgs.webRequest}.Query${entity}Request`,
    `${pkgs.webRequest}.Update${entity}Request`,
    'io.github.linpeilie.Converter',
    'jakarta.validation.Valid',
    'org.springframework.http.HttpStatus',
    'org.springframework.web.bind.annotation.DeleteMapping',
    'org.springframework.web.bind.annotation.GetMapping',
    'org.springframework.web.bind.annotation.ModelAttribute',
    'org.springframework.web.bind.annotation.PathVariable',
    'org.springframework.web.bind.annotation.PostMapping',
    'org.springframework.web.bind.annotation.PutMapping',
    'org.springframework.web.bind.annotation.RequestBody',
    'org.springframework.web.bind.annotation.RequestMapping',
    'org.springframework.web.bind.annotation.ResponseStatus',
    'org.springframework.web.bind.annotation.RestController',
    'lombok.AllArgsConstructor',
  ]
  if (definition.options.security) {
    imports.push('org.springframework.security.access.prepost.PreAuthorize')
  }
  return renderJava(ctx, 'backend/java/application/controller.ftl', {
    imports: uniqueImports(imports),
  })
}

export function generateApplicationFiles(ctx) {
  const { entity, pkgs } = ctx
  return [
    {
      pkg: pkgs.applicationCommand,
      file: `Create${entity}Command.java`,
      content: generateCommand(ctx, 'Create'),
    },
    {
      pkg: pkgs.applicationCommand,
      file: `Update${entity}Command.java`,
      content: generateCommand(ctx, 'Update'),
    },
    {
      pkg: pkgs.applicationCommand,
      file: `Query${entity}Command.java`,
      content: generateQueryCommand(ctx),
    },
    {
      pkg: pkgs.applicationDto,
      file: `${entity}DTO.java`,
      content: generateDto(ctx),
    },
    {
      pkg: pkgs.applicationLoader,
      file: `${entity}Loader.java`,
      content: generateLoader(ctx),
    },
    {
      pkg: pkgs.applicationQuery,
      file: `${entity}QueryService.java`,
      content: generateQueryService(ctx),
    },
    {
      pkg: pkgs.applicationService,
      file: `${entity}CommandService.java`,
      content: generateCommandService(ctx),
    },
    {
      pkg: pkgs.webRequest,
      file: `Create${entity}Request.java`,
      content: generateRequest(ctx, 'Create'),
    },
    {
      pkg: pkgs.webRequest,
      file: `Update${entity}Request.java`,
      content: generateRequest(ctx, 'Update'),
    },
    {
      pkg: pkgs.webRequest,
      file: `Query${entity}Request.java`,
      content: generateQueryRequest(ctx),
    },
    {
      pkg: pkgs.webController,
      file: `${entity}Controller.java`,
      content: generateController(ctx),
    },
  ]
}
