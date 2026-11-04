"""批次 2 剩余：toast 提示、列名、枚举文案。"""
import json

WORDS = {
    'zh-CN': {
        'system.action.create': '{entity}创建成功',
        'system.action.update': '{entity}已更新',
        'system.action.delete': '{entity}已删除',
        'system.action.deleteFailed': '{failed} 个{entity}删除失败，请刷新后重试',
        'system.action.deleteMany': '已删除 {count} 个{entity}',
        'system.entity.user': '用户',
        'system.entity.role': '角色',
        'system.entity.menu': '菜单',
        'system.entity.dept': '部门',
        'system.role.assignSaved': '已更新「{name}」的用户授权（{count} 人）',
        'system.role.deleteNote': '该角色的用户分配与菜单授权会一并清除，删除后不可恢复。',
    },
    'en-US': {
        'system.action.create': '{entity} created',
        'system.action.update': '{entity} updated',
        'system.action.delete': '{entity} deleted',
        'system.action.deleteFailed': '{failed} {entity} could not be deleted. Refresh and try again.',
        'system.action.deleteMany': 'Deleted {count} {entity}',
        'system.entity.user': 'user',
        'system.entity.role': 'role',
        'system.entity.menu': 'menu',
        'system.entity.dept': 'department',
        'system.role.assignSaved': 'Updated the user assignment of "{name}" ({count} users)',
        'system.role.deleteNote': 'The role\'s user assignments and menu grants are removed as well. This cannot be undone.',
    },
}

# 复数形式需要拆 _one/_other 的词条
PLURAL = {
    'zh-CN': {},
    'en-US': {
        'system.action.deleteMany': ('Deleted {count} {entity}', 'Deleted {count} {entity}'),
        'system.role.assignSaved': (
            'Updated the user assignment of "{name}" ({count} user)',
            'Updated the user assignment of "{name}" ({count} users)',
        ),
    },
}


def put(data, dotted, value):
    parts = dotted.split('.')
    cur = data
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value


for loc in ('zh-CN', 'en-US'):
    p = f'src/i18n/locales/{loc}.json'
    d = json.load(open(p, encoding='utf-8'))
    for key, value in WORDS[loc].items():
        plural = PLURAL[loc].get(key)
        if plural:
            put(d, key + '_one', plural[0])
            put(d, key + '_other', plural[1])
        else:
            put(d, key, value)
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(p, 'a').write('\n')
print('词条写入完成')
