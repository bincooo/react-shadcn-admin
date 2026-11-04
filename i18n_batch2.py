"""批次 2 收尾：validate 改为返回词条 key（模块级函数不持有 t），并补齐剩余多行 JSX。"""
import re

FILES = [
    'src/pages/system/users/modules/user-dialogs.tsx',
    'src/pages/system/depts/modules/dept-dialogs.tsx',
    'src/pages/system/roles/modules/role-dialogs.tsx',
]

for p in FILES:
    s = open(p, encoding='utf-8').read()

    # 1) validate 内已替换成 t(...) 的，改成返回 key 字面量
    s = re.sub(r"return t\('([^']+)'\)", r"return '\1'", s)

    # 2) 修正 validate 的返回类型注释：返回的是词条 key
    s = s.replace('/** 表单校验：返回第一个错误文案，通过则返回 null */',
                  '/** 表单校验：返回第一个错误词条 key（由调用方翻译），通过则返回 null */')
    s = s.replace('function validate(form: FormState, isCreate: boolean): string | null {',
                  'function validate(form: FormState, isCreate: boolean): string | null {')

    # 3) 调用点翻译
    s = s.replace('      toast.error(invalid)', '      toast.error(t(invalid))')
    s = s.replace('    toast.error(invalid)', '    toast.error(t(invalid))')
    s = s.replace("toast.error('请输入新密码（至少 6 位）')", "toast.error(t('system.user.error.password'))")

    # 4) 多行 JSX 的 label/hint
    s = s.replace('          label="密码"', "          label={t('system.field.password')}")
    s = s.replace('            label="新密码"', "            label={t('system.field.newPassword')}")
    s = s.replace('          label="状态"', "          label={t('common.status')}")
    s = s.replace('        label="角色编码"', "        label={t('system.role.code')}")
    s = s.replace("hint={isCreate ? '2~64 位字母、数字、下划线、冒号或短横线' : undefined}",
                  "hint={isCreate ? t('system.role.codeHint') : undefined}")

    open(p, 'w', encoding='utf-8').write(s)
    print('✔', p)

# 报告每个文件剩余中文字面量
for p in FILES:
    lines = [l for l in open(p, encoding='utf-8').read().splitlines()
             if not l.strip().startswith(('//', '*', '/*', '{/*'))]
    n = len(re.findall(r"['\"][^'\"\n]*[\u4e00-\u9fff][^'\"\n]*['\"]", '\n'.join(lines)))
    print(f'  剩余中文字面量: {n:2d}  {p}')
