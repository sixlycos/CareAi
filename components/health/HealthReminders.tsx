'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { HealthDatabaseClient } from '@/lib/supabase/database-client'
import { createClient } from '@/lib/supabase/client'
import { HealthReminder } from '@/lib/supabase/types'

interface HealthRemindersProps {
  userId?: string
}

export default function HealthReminders({ userId }: HealthRemindersProps) {
  const [reminders, setReminders] = useState<HealthReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [healthDB] = useState(() => new HealthDatabaseClient())

  useEffect(() => {
    loadReminders()
  }, [userId])

  const loadReminders = async () => {
    if (!userId) {
      // 如果没有传入userId，尝试获取当前用户
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      try {
        const userReminders = await healthDB.getUserHealthReminders(user.id)
        setReminders(userReminders)
      } catch (error) {
        console.error('加载健康提醒失败:', error)
      } finally {
        setLoading(false)
      }
    } else {
      // 使用传入的userId
      try {
        const userReminders = await healthDB.getUserHealthReminders(userId)
        setReminders(userReminders)
      } catch (error) {
        console.error('加载健康提醒失败:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCompleteReminder = async (reminderId: string, isCompleted: boolean) => {
    setUpdating(reminderId)
    try {
      const success = await healthDB.updateHealthReminderStatus(reminderId, isCompleted)
      
      if (success) {
        // 更新本地状态
        setReminders(prev => prev.map(reminder => 
          reminder.id === reminderId 
            ? { ...reminder, is_completed: isCompleted }
            : reminder
        ))
      }
    } catch (error) {
      console.error('更新提醒状态失败:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Calendar className="h-4 w-4 text-blue-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无截止日期'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `已过期 ${Math.abs(diffDays)} 天`
    } else if (diffDays === 0) {
      return '今天到期'
    } else if (diffDays === 1) {
      return '明天到期'
    } else {
      return `${diffDays} 天后到期`
    }
  }

  const getDateColor = (dateString: string | null) => {
    if (!dateString) return 'text-gray-500'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return 'text-red-600 font-semibold'
    } else if (diffDays <= 3) {
      return 'text-orange-600 font-semibold'
    } else if (diffDays <= 7) {
      return 'text-yellow-600'
    } else {
      return 'text-gray-600'
    }
  }

  // 分组提醒
  const pendingReminders = reminders.filter(r => !r.is_completed)
  const completedReminders = reminders.filter(r => r.is_completed)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            健康提醒
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 待完成提醒 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            待完成提醒
            {pendingReminders.length > 0 && (
              <Badge variant="secondary">{pendingReminders.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>太棒了！您暂时没有待完成的健康提醒</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={(checked) => 
                        handleCompleteReminder(reminder.id, !!checked)
                      }
                      disabled={updating === reminder.id}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(reminder.priority)}
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {reminder.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(reminder.priority)}
                        >
                          {reminder.priority === 'urgent' && '紧急'}
                          {reminder.priority === 'high' && '重要'}
                          {reminder.priority === 'medium' && '一般'}
                          {reminder.priority === 'low' && '低'}
                        </Badge>
                      </div>
                      
                      {reminder.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {reminder.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          类型: {reminder.reminder_type}
                        </span>
                        <span className={getDateColor(reminder.due_date)}>
                          {formatDate(reminder.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 已完成提醒 */}
      {completedReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              已完成提醒
              <Badge variant="secondary">{completedReminders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50 opacity-75"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={true}
                      onCheckedChange={(checked) => 
                        handleCompleteReminder(reminder.id, !!checked)
                      }
                      disabled={updating === reminder.id}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 line-through">
                          {reminder.title}
                        </h3>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          已完成
                        </Badge>
                      </div>
                      
                      {reminder.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 