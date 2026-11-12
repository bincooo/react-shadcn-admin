#!/usr/bin/env node
/**
 * 命令行生成入口：直接读取 data/[table].jsonl（取最后一行），不依赖页面。
 *
 * 用法：
 *   node apps/generator/scripts/generate.mjs --list
 *   node apps/generator/scripts/generate.mjs sys_order
 *   node apps/generator/scripts/generate.mjs sys_order --write --out /path/to/ddd-springboot
 *   node apps/generator/scripts/generate.mjs --all --json
 *   node apps/generator/scripts/generate.mjs --file data/sys_order.jsonl --zip output/order.zip
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  createZip,
  formatIssues,
  generateFiles,
  listTables,
  readDefinitionFile,
  readLatest,
  resolveFrontendDirectory,
  resolveOutputDirectory,
  writeGeneratedFiles,
} from '../core/index.mjs'

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const DATA_DIR = path.join(APP_ROOT, 'data')
const CWD = process.cwd()

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    list: { type: 'boolean', default: false },
    all: { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    'frontend-out': { type: 'string' },
    zip: { type: 'string' },
    file: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

function printHelp() {
  console.log(`后端代码模板生成器 CLI

用法:
  node apps/generator/scripts/generate.mjs <table> [...]
  node apps/generator/scripts/generate.mjs --all
  node apps/generator/scripts/generate.mjs --file <path.jsonl|path.json>

选项:
  --list                列出 data/ 下所有表定义
  --all                 生成 data/ 下全部表
  --file <path>         直接读取指定 jsonl / json 文件（取 jsonl 最后一行）
  --write               强制写入磁盘工程
  --out <dir>           覆盖后端输出目录（相对当前工作目录）
  --frontend-out <dir>  覆盖前端工程目录（相对当前工作目录）
  --zip <path>          强制输出 ZIP 到指定文件
  --json                只打印生成结果（路径 → 内容），不落盘
  -h, --help            显示帮助

默认输出由表定义 options.outputMode 决定: disk 写入 outputDirectory，zip 输出到 apps/generator/output/。
`)
}

function resolveFromCwd(value) {
  return path.isAbsolute(value) ? value : path.resolve(CWD, value)
}

/** 列出 data/ 下所有表定义 */
function printTableList(result) {
  console.log(`数据目录: ${DATA_DIR}`)
  if (result.tables.length === 0) {
    console.log('（暂无表定义）')
  }
  for (const table of result.tables) {
    const columnCount = String(table.columns).padStart(2)
    const detailLabel = table.details > 0 ? `${table.details} 明细` : ''
    console.log(
      `- ${table.name.padEnd(24)} ${table.entityName.padEnd(18)} ${columnCount} 列  ${detailLabel}  ${table.updatedAt ?? ''}`,
    )
  }
  for (const error of result.errors) {
    console.error(`! ${error.name}: ${error.error}`)
  }
}

/** 按 --file / --all / 位置参数收集待生成的表；无输入时返回 null */
async function collectEntries() {
  if (values.file) {
    return [
      {
        label: values.file,
        definition: await readDefinitionFile(resolveFromCwd(values.file)),
      },
    ]
  }

  if (values.all) {
    const result = await listTables(DATA_DIR)
    if (result.tables.length === 0) {
      throw new Error(`数据目录为空: ${DATA_DIR}`)
    }
    const entries = []
    for (const table of result.tables) {
      entries.push({
        label: table.name,
        definition: await readLatest(DATA_DIR, table.name),
      })
    }
    return entries
  }

  if (positionals.length === 0) return null

  const entries = []
  for (const name of positionals) {
    entries.push({
      label: name,
      definition: await readLatest(DATA_DIR, name),
    })
  }
  return entries
}

/** 把生成文件写入后端 / 前端工程（--out 优先，其次表定义目录） */
async function writeToDisk(generated, options) {
  const outputDirectory = values.out
    ? resolveFromCwd(values.out)
    : resolveOutputDirectory(options.outputDirectory, APP_ROOT)
  const frontendDirectory = values['frontend-out']
    ? resolveFromCwd(values['frontend-out'])
    : resolveFrontendDirectory(options.frontendDirectory, APP_ROOT)
  const result = await writeGeneratedFiles(generated.files, {
    outputDirectory,
    frontendDirectory,
  })
  console.log(`  后端写入: ${result.targetDirectory}`)
  console.log(
    `  created ${result.created - result.frontendCreated} / updated ${result.updated - result.frontendUpdated}`,
  )
  if (result.frontendTargetDirectory) {
    console.log(`  前端写入: ${result.frontendTargetDirectory}`)
    console.log(
      `  created ${result.frontendCreated} / updated ${result.frontendUpdated}`,
    )
  }
}

async function writeZip(generated) {
  const fileName = `${generated.summary.entity}-ddd.zip`
  const zipPath = values.zip
    ? resolveFromCwd(values.zip)
    : path.join(
        values.out ? resolveFromCwd(values.out) : path.join(APP_ROOT, 'output'),
        fileName,
      )
  await fs.mkdir(path.dirname(zipPath), { recursive: true })
  const buffer = createZip(generated.files)
  await fs.writeFile(zipPath, buffer)
  console.log(`  ZIP: ${zipPath}（${buffer.length} bytes）`)
}

async function main() {
  if (values.help) {
    printHelp()
    return
  }

  if (values.list) {
    printTableList(await listTables(DATA_DIR))
    return
  }

  const entries = await collectEntries()
  if (!entries) {
    printHelp()
    process.exitCode = 1
    return
  }

  for (const entry of entries) {
    const generated = generateFiles(entry.definition)
    if (values.json) {
      console.log(
        JSON.stringify(
          {
            table: entry.label,
            summary: generated.summary,
            files: generated.files,
          },
          null,
          2,
        ),
      )
      continue
    }

    const options = generated.definition.options
    let mode = options.outputMode
    if (values.write) mode = 'disk'
    else if (values.zip) mode = 'zip'
    console.log(
      `\n▶ ${entry.label} → ${generated.summary.entity}（${generated.summary.fileCount} 个文件，${generated.summary.detailCount} 个明细表）`,
    )

    if (mode === 'disk') await writeToDisk(generated, options)
    else await writeZip(generated)
  }
}

main().catch((error) => {
  console.error(`\n✖ ${formatIssues(error)}`)
  if (process.env.GENERATOR_DEBUG) console.error(error)
  process.exitCode = 1
})
