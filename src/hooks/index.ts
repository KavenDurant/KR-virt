/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-19 10:31:04
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-19 10:33:20
 * @FilePath: /KR-virt/src/hooks/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 导出现有的hooks
export { useTheme } from './useTheme';

// 导出新的侧边栏相关hooks
export {
  useSidebarSelection,
  type SidebarNodeType,
  type SidebarSelectionDetail,
  type SidebarSelectionState,
  type SidebarSelectionActions,
  type UseSidebarSelectionReturn,
} from './useSidebarSelection';

// 导出时区处理相关hooks
export {
  useTimeZone,
  useTimeZoneBatch,
  useTimezoneInfo,
  type UseTimeZoneOptions,
  type UseTimeZoneResult,
} from './useTimeZone';

export {
  useSidebarRefresh,
  triggerSidebarRefresh,
  SidebarRefreshTypes,
  SidebarRefreshActions,
  SidebarRefreshTriggers,
  type SidebarRefreshDetail,
  type SidebarRefreshCallback,
  type UseSidebarRefreshOptions,
} from './useSidebarRefresh';

export {
  useSidebarHostActions,
  triggerSidebarHostAction,
  HOST_ACTION_MAPPING,
  HostActionTypes,
  HostActionTriggers,
  type SidebarHostActionDetail,
  type HostActionCallback,
  type UseSidebarHostActionsOptions,
} from './useSidebarHostActions';
