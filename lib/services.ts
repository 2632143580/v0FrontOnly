// API 调用层：每个接口一个函数，全部对接真实后端（见「前后端对接清单」）。
import { api } from './api'
import type {
  ChatMessage,
  ConfigData,
  LogEntry,
  Reminder,
  SystemStatus,
  WxLoginResponse,
  WxMessage,
  WxStatus,
} from './console-types'

// 系统状态
export const getStatus = () => api.get<SystemStatus>('/api/status')

// 配置
export const getConfig = () => api.get<ConfigData>('/api/config')
export const putConfig = (changed: Record<string, string>) =>
  api.put<{ updated: string[]; need_restart: boolean }>('/api/config', changed)
export const testConnection = () =>
  api.post<{ ok: boolean; latency_ms?: number; message?: string }>('/api/test-connection')

// 对话
export const getDialogues = (limit = 20) =>
  api.get<ChatMessage[]>(`/api/dialogues?limit=${limit}`)
export const sendMessage = (content: string) =>
  api.post<ChatMessage>('/api/message', { content })

// 提醒
export const getReminders = () => api.get<Reminder[]>('/api/reminders')
export const deleteReminder = (jobId: string) =>
  api.del<void>(`/api/reminders/${jobId}`)

// 日志
export const getLogs = (limit = 30) =>
  api.get<LogEntry[]>(`/api/logs?limit=${limit}`)

// 微信
export const wxLogin = () => api.post<WxLoginResponse>('/api/weixin/login')
export const wxLoginStatus = (eventId: string) =>
  api.get<{ state: string }>(`/api/weixin/login-status?event_id=${eventId}`)
export const wxStatus = () => api.get<WxStatus>('/api/weixin/status')
export const wxMessages = (limit = 50) =>
  api.get<WxMessage[]>(`/api/weixin/messages?limit=${limit}`)
export const wxSend = (to: string, content: string) =>
  api.post<{ ok: boolean }>('/api/weixin/send', { to, content })
