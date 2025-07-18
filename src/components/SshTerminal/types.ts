/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-18 09:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-18 09:30:00
 * @FilePath: /KR-virt/src/components/SshTerminal/types.ts
 * @Description: SSH终端组件类型定义
 */

// 原SshTerminalProps已移除，现在使用LocalSshTerminal组件

export interface WebSocketMessage {
  type: 'input' | 'resize' | 'data' | 'error';
  data?: string;
  cols?: number;
  rows?: number;
  message?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface KeyboardShortcuts {
  copy: string[];
  paste: string[];
  clear: string[];
  search: string[];
  fullscreen: string[];
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  copy: ['Ctrl+C', 'Ctrl+Shift+C'],
  paste: ['Ctrl+V', 'Ctrl+Shift+V'],
  clear: ['Ctrl+L'],
  search: ['Ctrl+F'],
  fullscreen: ['F11']
};
