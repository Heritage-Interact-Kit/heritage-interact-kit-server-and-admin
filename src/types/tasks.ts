export interface Task {
  id: number
  object_id: number
  title: string | null
  description: string | null
  thumbnail_url: string | null
  detailed_img_url: string | null
  created_at: string
}

export interface CreateTaskRequest {
  object_id: number
  title: string
  description?: string
  thumbnail_url?: string
  detailed_img_url?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  thumbnail_url?: string
  detailed_img_url?: string
}

export interface TaskResponse {
  data: Task
}

export interface TasksResponse {
  data: Task[]
} 