import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PanelLeft,
  LayoutGrid,
  LayoutTemplate,
  SquareDashedMousePointer,
  Moon,
  Sparkles,
  Minimize2,
  Copyright,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useResolvedMode } from '@/lib/theme/theme-runtime'
import { useThemeStore } from '@/store/theme'
import type { ThemeConfig } from '@/config/theme'
import { Section } from '../section'
import { ToggleRow, RangeField, SegmentedOption } from './rows'
import { PANEL_CARD, PANEL_STACK, ROW_ICON, SEGMENTED } from './panel-styles'

/**
 * 元素区的开关行：顺序即渲染顺序。
 * 文案 key 与字段同名（interface.<key> / interface.<key>Desc），无需逐行重复。
 */
const TOGGLE_ROWS = [
  { key: 'showTabs', icon: LayoutTemplate },
  { key: 'darkSidebar', icon: Moon },
  { key: 'menuPanelMode', icon: LayoutGrid },
  { key: 'showBreadcrumb', icon: PanelLeft },
  { key: 'keepAlive', icon: Sparkles },
  { key: 'pageTransition', icon: Sparkles },
  { key: 'compactMode', icon: Minimize2 },
  { key: 'showFooter', icon: Copyright },
] as const
/** 界面页签：布局骨架、侧栏、页签栏与内容区密度等结构开关 */
export function InterfaceTab() {
  const { t } = useTranslation()
  // 只订阅本标签页真正用到的字段：拖动主色 / 状态色时不会连带重渲染
  const s = useThemeStore(
    useShallow((st) => ({
      sidebarWidth: st.sidebarWidth,
      headerHeight: st.headerHeight,
      showTabs: st.showTabs,
      showBreadcrumb: st.showBreadcrumb,
      keepAlive: st.keepAlive,
      showFooter: st.showFooter,
      compactMode: st.compactMode,
      borderRadius: st.borderRadius,
      contentWidth: st.contentWidth,
      pageTransition: st.pageTransition,
      darkSidebar: st.darkSidebar,
      darkSidebarScope: st.darkSidebarScope,
      menuPanelMode: st.menuPanelMode,
      layoutStyle: st.layoutStyle,
      update: st.update,
    })),
  )

  // 双列 / 分栏布局才有「第二列侧栏」，暗色范围选项只在这时有意义
  const twoColumn = s.layoutStyle === 'split' || s.layoutStyle === 'double'
  // 黑暗模式下侧栏本就是暗色，暗色侧栏开关无意义（auto 解析为暗色时同理）
  const darkMode = useResolvedMode() === 'dark'
  // 范围只在双列 / 分栏且亮色模式下开启了暗色侧栏时可调
  const scopeDisabled = !twoColumn || darkMode || !s.darkSidebar

  return (
    <div className={PANEL_STACK}>
      <Section
        icon={SquareDashedMousePointer}
        title={t('interface.sizeSection')}
      >
        <div className="flex flex-col gap-2.5">
          <RangeField
            label={t('interface.sidebarWidth')}
            value={s.sidebarWidth}
            min={200}
            max={320}
            step={4}
            onChange={(sidebarWidth) => s.update({ sidebarWidth })}
          />
          <RangeField
            label={t('interface.headerHeight')}
            value={s.headerHeight}
            min={48}
            max={72}
            step={2}
            onChange={(headerHeight) => s.update({ headerHeight })}
          />
          <RangeField
            label={t('interface.borderRadius')}
            value={s.borderRadius}
            min={0}
            max={20}
            onChange={(borderRadius) => s.update({ borderRadius })}
          />
        </div>
      </Section>

      <Section icon={LayoutTemplate} title={t('interface.contentWidth')}>
        <div className={`${SEGMENTED} grid-cols-2`}>
          {(['fluid', 'boxed'] as const).map((value) => (
            <SegmentedOption
              key={value}
              active={s.contentWidth === value}
              onClick={() => s.update({ contentWidth: value })}
              className="h-8 text-[12.5px]"
            >
              {t(`interface.${value}`)}
            </SegmentedOption>
          ))}
        </div>
      </Section>

      <Section icon={PanelLeft} title={t('interface.elementSection')}>
        <div className="flex flex-col gap-2">
          {TOGGLE_ROWS.map(({ key, icon }) => (
            <Fragment key={key}>
              <ToggleRow
                icon={icon}
                label={t(`interface.${key}`)}
                description={t(`interface.${key}Desc`)}
                checked={s[key]}
                onCheckedChange={(checked) =>
                  s.update({ [key]: checked } as Partial<ThemeConfig>)
                }
                disabled={key === 'darkSidebar' && darkMode}
              />
              {key === 'darkSidebar' && (
                <div
                  className={cn(
                    'flex items-center gap-3',
                    PANEL_CARD,
                    scopeDisabled && 'opacity-55',
                  )}
                >
                  <span className={ROW_ICON}>
                    <Moon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="block text-[12.5px] font-medium text-foreground">
                      {t('interface.darkScope')}
                    </p>
                    <p className="block text-[10.5px] text-muted-foreground">
                      {t('interface.darkScopeDesc')}
                    </p>
                  </div>
                  <div className={`${SEGMENTED} w-45 shrink-0 grid-cols-2`}>
                    {(['first', 'all'] as const).map((value) => (
                      <SegmentedOption
                        key={value}
                        disabled={scopeDisabled}
                        active={s.darkSidebarScope === value}
                        onClick={() => s.update({ darkSidebarScope: value })}
                        className={cn(
                          'h-7 text-[11.5px]',
                          !scopeDisabled && 'cursor-pointer',
                        )}
                      >
                        {t(`interface.darkScope_${value}`)}
                      </SegmentedOption>
                    ))}
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </Section>
    </div>
  )
}
