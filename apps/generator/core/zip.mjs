/**
 * 极简 ZIP 打包（STORE 存储模式，无第三方依赖）。
 * 生成产物都是小文本文件，不压缩可避免引入额外依赖，且所有解压工具都兼容。
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  const day =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: day }
}

function normalizeName(name) {
  return String(name).replace(/\\/g, '/').replace(/^\/+/, '')
}

/**
 * @param {Record<string, string | Buffer | Uint8Array>} files
 * @returns {Buffer}
 */
export function createZip(files) {
  const entries = Object.entries(files).sort(([left], [right]) =>
    left.localeCompare(right),
  )
  const { time, date } = dosDateTime()
  const chunks = []
  const central = []
  let offset = 0

  for (const [rawName, content] of entries) {
    const name = normalizeName(rawName)
    const nameBuffer = Buffer.from(name, 'utf8')
    const data = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content, 'utf8')
    const crc = crc32(data)
    const flags = 0x0800 // UTF-8 文件名

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuffer.length, 26)
    local.writeUInt16LE(0, 28)

    chunks.push(local, nameBuffer, data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(flags, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(time, 12)
    centralHeader.writeUInt16LE(date, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(data.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    central.push(centralHeader, nameBuffer)

    offset += local.length + nameBuffer.length + data.length
  }

  const centralSize = central.reduce((total, chunk) => total + chunk.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...chunks, ...central, end])
}
