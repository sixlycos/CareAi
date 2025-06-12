# 数据库字段参考文档

## user_profiles 表字段说明

### 系统字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键，自动生成 |
| `user_id` | UUID | 关联到 auth.users 的外键，唯一 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

### 统计字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `reports_analyzed` | INTEGER | 已分析报告数量，默认 0 |
| `consultation_count` | INTEGER | 咨询次数，默认 0 |
| `health_score` | INTEGER | 健康得分（0-100），可为空 |
| `next_checkup` | DATE | 下次体检日期，可为空 |

### 基础信息
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `age` | INTEGER | 年龄（0-100），可为空 |
| `gender` | TEXT | 性别，可为空 |
| `height` | VARCHAR(50) | 身高，可为空 |
| `weight` | VARCHAR(50) | 体重，可为空 |

### 健康背景
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `medical_history` | JSONB | 既往病史数组，默认 [] |
| `family_history` | JSONB | 家族病史数组，默认 [] |
| `medications` | TEXT | 正在服用的药物，可为空 |
| `allergies` | TEXT | 过敏史，可为空 |

### 生活习惯
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `exercise_frequency` | VARCHAR(100) | 运动频率，可为空 |
| `smoking_status` | VARCHAR(50) | 吸烟状况，可为空 |
| `drinking_status` | VARCHAR(50) | 饮酒状况，可为空 |
| `sleep_hours` | VARCHAR(20) | 平均睡眠时间，可为空 |
| `stress_level` | VARCHAR(50) | 压力水平，可为空 |

### 健康目标
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `health_goals` | JSONB | 健康目标数组，默认 [] |
| `target_weight` | VARCHAR(50) | 目标体重，可为空 |
| `other_goals` | TEXT | 其他健康目标，可为空 |

### 状态字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `profile_completed` | BOOLEAN | 档案是否完成，默认 false |

### 扩展字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `preferences` | JSONB | 用户偏好设置和自定义数据，默认 {} |

## 数据示例

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "auth-user-id-here",
  "age": 30,
  "gender": "male",
  "height": "175",
  "weight": "70",
  "medical_history": ["高血压", "糖尿病"],
  "family_history": ["心血管疾病"],
  "medications": "降压药",
  "allergies": "青霉素",
  "exercise_frequency": "每周3-4次",
  "smoking_status": "从不吸烟",
  "drinking_status": "偶尔饮酒",
  "sleep_hours": "7-8小时",
  "stress_level": "中等",
  "health_goals": ["减重", "控制血压"],
  "target_weight": "65",
  "other_goals": "改善睡眠质量",
  "profile_completed": true,
  "reports_analyzed": 5,
  "consultation_count": 10,
  "health_score": 75,
  "next_checkup": "2024-06-01",
  "preferences": {
    "custom_medical_history": "其他病史详情",
    "custom_family_history": "其他家族病史",
    "custom_exercise_frequency": "自定义运动描述",
    "custom_health_goals": "自定义健康目标"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

## 注意事项

1. **JSONB 字段**：`medical_history`、`family_history`、`health_goals` 使用 JSONB 存储数组数据
2. **自定义数据**：用户的自定义输入存储在 `preferences` 字段中
3. **约束条件**：
   - `age` 范围：0-100
   - `health_score` 范围：0-100
   - `user_id` 必须唯一
4. **默认值**：新用户创建时，统计字段有合理的默认值
5. **行级安全**：启用了 RLS，用户只能访问自己的数据 