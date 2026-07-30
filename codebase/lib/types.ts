/**
 * Shape của các response API, lấy đúng theo backend thật của vlearn.dev
 * (khảo sát trực tiếp từ /api/backend/api/v1/... khi đã đăng nhập).
 * Giữ nguyên snake_case để phần frontend này port sang app thật được.
 */

export interface CurrentUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

export interface CourseSummary {
  course_id: string;
  course_name: string;
  department_id: string;
  lecturer_id: number;
  enrolled_student_count: number;
  open_material_count: number;
  completed_material_count: number;
  ingested_document_count: number;
  reading_progress_percent: number;
}

export interface CourseListResponse {
  items: CourseSummary[];
}

export type ItemStatus = "active" | "draft" | "archived";

export interface CurriculumItem {
  id: string;
  type: "pdf";
  title: string;
  status: ItemStatus;
  lecture_id: string;
  position: number;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  status: ItemStatus;
  position: number;
  items: CurriculumItem[];
}

export interface Curriculum {
  course_id: string;
  chapters: CurriculumChapter[];
}

export interface MaterialDocument {
  material_id: string;
  course_id: string;
  lecture_id: string;
  title: string;
  file_name: string;
  page_count: number;
  chunk_count: number;
  status: "indexed" | "processing" | "failed";
  ocr_status: "done" | "pending" | "failed";
  updated_at: string;
  enhancement_pending: boolean;
  pdf_url: string;
}

export interface DocumentListResponse {
  items: MaterialDocument[];
}

export interface DayCompletion {
  day_code: string;
  state: "not_started" | "in_progress" | "completed";
  entry_done: boolean;
  post_done: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}

/* ------------------------------------------------------------------ */
/* VLearn Tutor                                                        */
/* ------------------------------------------------------------------ */

export interface Citation {
  document_title: string;
  page: number;
  section: string | null;
  quote: string;
}

/**
 * Nhà cung cấp đã sinh ra câu trả lời. Phải hiển thị lên UI: bài nộp không
 * được trình bày `mock` như thể là AI chạy thật.
 */
export type TutorProvider = "anthropic" | "mock";

/** Kết quả cuối một lượt hỏi, khớp shape bản gốc dựng ở RUN_FINISHED. */
export interface TutorFinal {
  message_id: string | null;
  answer: string;
  citations: Citation[];
  confidence: number;
  status: "answered" | "not_found" | "refused";
  conversation_id: string;
  provider: TutorProvider;
  memory_used: boolean;
  cache_hit: boolean;
}

export interface TutorScope {
  course_id: string;
  lecture_id: string;
  material_id?: string;
}

export interface TutorAskRequest extends TutorScope {
  page_number: number;
  user_question: string;
  selected_text?: string;
  conversation_id?: string;
  force_new_conversation?: boolean;
}

export type ChatSender = "user" | "ai";

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  /** Trang slide đang mở khi câu hỏi được gửi. */
  pageNumber?: number;
  selectedText?: string;
  /** Chỉ có ở message của AI sau khi RUN_FINISHED. */
  final?: TutorFinal;
  streaming?: boolean;
  error?: string;
  rating?: "up" | "down";
}
