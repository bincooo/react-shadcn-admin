"""批次 2 批量补词条 + 替换硬编码文案。

每条的构造都基于原中文文案本身，英文侧给出对应译文，避免出现半中半英。
"""
import io
import json
import re
import subprocess

# ---------------------------------------------------------------- 词条定义
# key -> (zh, en)。en 为 None 时按 zh 的复数形式展开 _one/_other。
ENTRIES = {
    # ---- 通用校验与占位
    'common.required': ('请输入', 'Enter a value'),
    'system.field.password': ('密码', 'Password'),
    'system.field.nickname': ('昵称', 'Nickname'),
    'system.field.dept': ('所属部门', 'Department'),
    'system.field.sort': ('排序', 'Sort order'),
    'system.field.newPassword': ('新密码', 'New password'),
    'system.field.parentDept': ('上级部门', 'Parent department'),
    'system.field.deptCode': ('部门编码', 'Department code'),
    'system.field.deptName': ('部门名称', 'Department name'),

    # ---- 用户
    'system.user.passwordHint': ('仅创建时填写，至少 6 位', 'Required when creating; at least 6 characters'),
    'system.user.roleHint': ('至少选择一个角色', 'Select at least one role'),
    'system.user.unboundDept': ('未绑定', 'Unassigned'),
    'system.user.newPasswordHint': ('6-64 位，明文不会保存或回显', '6–64 characters; never stored or shown in plain text'),
    'system.user.error.username': ('请输入账号（3~32 位）', 'Account must be 3–32 characters'),
    'system.user.error.password': ('请输入密码（至少 6 位）', 'Password must be at least 6 characters'),
    'system.user.error.email': ('邮箱格式无效', 'Invalid email address'),
    'system.user.error.roles': ('请至少选择一个角色', 'Select at least one role'),

    # ---- 部门
    'system.dept.error.code': ('请输入部门编码', 'Department code is required'),
    'system.dept.error.name': ('请输入部门名称', 'Department name is required'),
    'system.dept.error.sort': ('排序需为非负整数', 'Sort order must be a non-negative integer'),
    'system.dept.rootOption': ('无（根部门）', 'None (root department)'),
    'system.dept.editHint': ('部门编码创建后不可修改，状态变更即时生效。',
                             'The department code cannot change after creation; status updates apply immediately.'),

    # ---- 角色
    'system.role.editHint': ('角色编码创建后不可修改，状态变更即时生效。',
                             'The role code cannot change after creation; status updates apply immediately.'),
    'system.role.codeHint': ('2~64 位字母、数字、下划线、冒号或短横线',
                             '2–64 characters: letters, digits, underscore, colon or hyphen'),
    'system.role.error.code': ('请输入角色编码（2~64 位字母、数字、_:-）',
                               'Role code must be 2–64 letters, digits, _ : or -'),
    'system.role.error.name': ('请输入角色名称（1~128 位）', 'Role name must be 1–128 characters'),
    'system.role.error.description': ('描述不能超过 256 位', 'Description cannot exceed 256 characters'),
}

# 复数/带插值的词条：(zh, en_one, en_other)
PLURAL_ENTRIES = {}


def flat_set(data, dotted, value):
    parts = dotted.split('.')
    cur = data
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value


def apply_locale():
    for loc in ('zh-CN', 'en-US'):
        p = f'src/i18n/locales/{loc}.json'
        data = json.load(open(p, encoding='utf-8'))
        for key, (zh, en) in ENTRIES.items():
            flat_set(data, key, zh if loc == 'zh-CN' else en)
        json.dump(data, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        open(p, 'a').write('\n')
    print(f'写入 {len(ENTRIES)} 条词条 × 2 语言')


# ---------------------------------------------------------------- 源码替换
# (文件, 原文, 替换为, 是否需要 t())
REPLACEMENTS = [
    # ---------------- user-dialogs.tsx
    ('src/pages/system/users/modules/user-dialogs.tsx',
     "    return '请输入账号（3~32 位）'", "    return t('system.user.error.username')"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     "    return '请输入密码（至少 6 位）'", "    return t('system.user.error.password')"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     "    return '邮箱格式无效'", "    return t('system.user.error.email')"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     'description="系统账号的增删改查，改动即时生效。"', "description={t('system.user.description')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="账号"', "<FormField label={t('system.user.keyword')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="密码"', "<FormField label={t('system.field.password')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     'hint="仅创建时填写，至少 6 位"', "hint={t('system.user.passwordHint')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="昵称"', "<FormField label={t('system.field.nickname')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="角色"', "<FormField label={t('system.user.roles')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="所属部门"', "<FormField label={t('system.field.dept')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="邮箱"', "<FormField label={t('system.user.email')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="手机号"', "<FormField label={t('system.user.phone')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormSwitchField\n        label="状态"', "<FormSwitchField\n        label={t('common.status')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     "    return '请输入新密码（至少 6 位）'", "    return t('system.user.error.password')"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     '<FormField label="新密码"', "<FormField label={t('system.field.newPassword')}"),
    ('src/pages/system/users/modules/user-dialogs.tsx',
     'hint="6-64 位，明文不会保存或回显"', "hint={t('system.user.newPasswordHint')}"),

    # ---------------- dept-dialogs.tsx
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     "    return '请输入部门编码'", "    return t('system.dept.error.code')"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     "    return '请输入部门名称'", "    return t('system.dept.error.name')"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     "    return '排序需为非负整数'", "    return t('system.dept.error.sort')"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     'description="部门编码创建后不可修改，状态变更即时生效。"', "description={t('system.dept.editHint')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormField label="上级部门"', "<FormField label={t('system.field.parentDept')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     'nullLabel="无（根部门）"', "nullLabel={t('system.dept.rootOption')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormField label="部门编码"', "<FormField label={t('system.field.deptCode')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormField label="部门名称"', "<FormField label={t('system.field.deptName')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormField label="排序"', "<FormField label={t('system.field.sort')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormSwitchField\n        label="状态"', "<FormSwitchField\n        label={t('common.status')}"),
    ('src/pages/system/depts/modules/dept-dialogs.tsx',
     '<FormField label="描述"', "<FormField label={t('common.description')}"),

    # ---------------- role-dialogs.tsx
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     "    return '请输入角色编码（2~64 位字母、数字、_:-）'", "    return t('system.role.error.code')"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     "    return '请输入角色名称（1~128 位）'", "    return t('system.role.error.name')"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     "    return '描述不能超过 256 位'", "    return t('system.role.error.description')"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     'description="角色编码创建后不可修改，状态变更即时生效。"', "description={t('system.role.editHint')}"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     '<FormField label="角色编码"', "<FormField label={t('system.role.code')}"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     'hint="2~64 位字母、数字、下划线、冒号或短横线"', "hint={t('system.role.codeHint')}"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     '<FormField label="角色名称"', "<FormField label={t('system.role.name')}"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     '<FormField label="描述"', "<FormField label={t('common.description')}"),
    ('src/pages/system/roles/modules/role-dialogs.tsx',
     '<FormSwitchField\n        label="状态"', "<FormSwitchField\n        label={t('common.status')}"),
]


def apply_replacements():
    touched = set()
    missed = []
    for path, old, new in REPLACEMENTS:
        s = open(path, encoding='utf-8').read()
        if old not in s:
            missed.append((path, old[:40]))
            continue
        s = s.replace(old, new)
        open(path, 'w', encoding='utf-8').write(s)
        touched.add(path)
    print(f'替换成功 {len(REPLACEMENTS) - len(missed)}/{len(REPLACEMENTS)}')
    for m in missed:
        print('  ✗ 未命中:', m)


if __name__ == '__main__':
    apply_locale()
    apply_replacements()
