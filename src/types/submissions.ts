export interface Submission {
  id: number
  task_id: number
  end_user_id: number
  object_id: number
  remarks: string | null
  submitted_files: string[]
  created_at: string
  updated_at: string
}

// Extended interface that includes related data for admin views
export interface SubmissionWithDetails extends Submission {
  task?: {
    id: number
    title: string | null
    object_id: number
  }
  end_user?: {
    id: number
    email: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
  }
  object?: {
    id: number
    title: string | null
  }
}

// For end user mobile app submissions
export interface CreateSubmissionRequest {
  task_id: number
  remarks?: string
  submitted_files?: string[]
}

// For updating submissions (end users can update their own)
export interface UpdateSubmissionRequest {
  remarks?: string
  submitted_files?: string[]
}

// For admin updates (admins might have additional capabilities)
export interface AdminUpdateSubmissionRequest {
  remarks?: string
  submitted_files?: string[]
}

export interface SubmissionResponse {
  data: Submission
}

export interface SubmissionsResponse {
  data: Submission[]
}

export interface SubmissionsWithDetailsResponse {
  data: SubmissionWithDetails[]
}

export interface SubmissionStatsResponse {
  data: {
    total_submissions: number
    submissions_this_month: number
    unique_submitters: number
  }
} 