/**
 * Fixture lấy nguyên văn từ backend thật của vlearn.dev (course COMP2010).
 * Mọi id / lecture_id / material_id / page_count đều là giá trị thật, nhờ đó
 * URL reader khớp 1:1 với bản gốc và có thể đối chiếu trực tiếp.
 */
import type {
  CourseSummary,
  Curriculum,
  CurrentUser,
  DayCompletion,
  MaterialDocument,
  Notification,
} from "@/lib/types";

export const CURRENT_USER: CurrentUser = {
  id: 1525,
  email: "23001525@hus.edu.vn",
  username: "23001525",
  full_name: "NGUYỄN KHẮC HUY",
  role: "student",
  department_id: null,
};

export const COURSES: CourseSummary[] = [
  {
    course_id: "COMP2010",
    course_name: "Khoá 3 + 4 Phase 1",
    department_id: "FIT",
    lecturer_id: 3,
    enrolled_student_count: 1074,
    open_material_count: 12,
    completed_material_count: 0,
    ingested_document_count: 18,
    reading_progress_percent: 0,
  },
];

/** Chỉ liệt kê các material đang nằm trong curriculum (12 material "open"). */
const MATERIAL_SEED: Array<{
  material_id: string;
  file_name: string;
  page_count: number;
  updated_at: string;
}> = [
  { material_id: "material_ms2039d0_hnxpxy", file_name: "day01_302.pdf", page_count: 83, updated_at: "2026-07-26T16:17:15.958160+00:00" },
  { material_id: "material_ms203mb1_squf06", file_name: "material_mrxpq9zu_t8e6xs.pdf", page_count: 32, updated_at: "2026-07-26T16:17:15.748200+00:00" },
  { material_id: "material_ms203vsq_ob7vqp", file_name: "material_95eb786b4d9e.pdf", page_count: 76, updated_at: "2026-07-26T16:17:16.100000+00:00" },
  { material_id: "material_ms2044ey_k6uor3", file_name: "day03-tu-chatbot-den-agentic-agent-react.pdf", page_count: 46, updated_at: "2026-07-26T16:17:16.200000+00:00" },
  { material_id: "material_ms2lb2ke_c1je8j", file_name: "Day03-D302-tu-chatbot-den-agentic-agent-react.pdf", page_count: 60, updated_at: "2026-07-27T09:02:11.000000+00:00" },
  { material_id: "material_ms204i6x_gqwyya", file_name: "day04-prompt-engineering-tool-calling.pdf", page_count: 43, updated_at: "2026-07-26T16:17:16.300000+00:00" },
  { material_id: "material_ms4ahenz_7cpqa2", file_name: "day04-prompt-engineering-tool-calling.pdf", page_count: 78, updated_at: "2026-07-28T08:14:02.000000+00:00" },
  { material_id: "material_ms4x7dx1_t0qyxg", file_name: "day04-prompt-engineering-tool-calling.pdf", page_count: 98, updated_at: "2026-07-28T14:31:47.000000+00:00" },
  { material_id: "material_ms204v3b_r9mo78", file_name: "day05-ai-product-thinking-requirements.pdf", page_count: 44, updated_at: "2026-07-26T16:17:16.400000+00:00" },
  { material_id: "material_ms5r18w1_oe5xlz", file_name: "day05-lecture-slides-batch03.pdf", page_count: 39, updated_at: "2026-07-29T07:45:19.000000+00:00" },
  { material_id: "material_ms5rpr5o_wgl8wy", file_name: "day05-slide-batch03-C401.pdf", page_count: 62, updated_at: "2026-07-29T10:22:03.000000+00:00" },
  { material_id: "material_ms204yc9_gxpg9y", file_name: "day06-ai-product-project-management.pdf", page_count: 37, updated_at: "2026-07-26T16:17:16.500000+00:00" },
];

/**
 * Bản gốc đặt lecture_id = "Lecture_" + material_id cho các material đã lên
 * curriculum, và title trùng file_name.
 */
export const DOCUMENTS: MaterialDocument[] = MATERIAL_SEED.map((seed) => ({
  material_id: seed.material_id,
  course_id: "COMP2010",
  lecture_id: `Lecture_${seed.material_id}`,
  title: seed.file_name,
  file_name: seed.file_name,
  page_count: seed.page_count,
  chunk_count: 0,
  status: "indexed",
  ocr_status: "done",
  updated_at: seed.updated_at,
  enhancement_pending: false,
  pdf_url: `/materials/${seed.material_id}.pdf`,
}));

const docByMaterial = new Map(DOCUMENTS.map((d) => [d.material_id, d]));

function chapterItems(materialIds: string[]) {
  return materialIds.map((id, index) => {
    const doc = docByMaterial.get(id)!;
    return {
      id,
      type: "pdf" as const,
      title: doc.file_name,
      status: "active" as const,
      lecture_id: doc.lecture_id,
      position: index + 1,
    };
  });
}

export const CURRICULUM: Curriculum = {
  course_id: "COMP2010",
  chapters: [
    {
      id: "chapter_0b95ae7e5b17b6f5",
      title: "Day 1",
      status: "active",
      position: 1,
      items: chapterItems(["material_ms2039d0_hnxpxy", "material_ms203mb1_squf06"]),
    },
    {
      id: "chapter_2aaba948e1fb5597",
      title: "Day 2",
      status: "active",
      position: 2,
      items: chapterItems(["material_ms203vsq_ob7vqp"]),
    },
    {
      id: "chapter_5d5bf4c1720e995d",
      title: "Day 3",
      status: "active",
      position: 3,
      items: chapterItems(["material_ms2044ey_k6uor3", "material_ms2lb2ke_c1je8j"]),
    },
    {
      id: "chapter_7ac754967294c477",
      title: "Day 4",
      status: "active",
      position: 4,
      items: chapterItems([
        "material_ms204i6x_gqwyya",
        "material_ms4ahenz_7cpqa2",
        "material_ms4x7dx1_t0qyxg",
      ]),
    },
    {
      id: "chapter_086c75169d5344c2",
      title: "Day 5",
      status: "active",
      position: 5,
      items: chapterItems([
        "material_ms204v3b_r9mo78",
        "material_ms5r18w1_oe5xlz",
        "material_ms5rpr5o_wgl8wy",
      ]),
    },
    {
      id: "chapter_5f42bfb3e99f0ad7",
      title: "Day 6",
      status: "active",
      position: 6,
      items: chapterItems(["material_ms204yc9_gxpg9y"]),
    },
  ],
};

/** Bản gốc dùng day code dạng "day-01".."day-06" cho endpoint completion. */
export const DAY_CODES = CURRICULUM.chapters.map(
  (_, index) => `day-${String(index + 1).padStart(2, "0")}`,
);

export function dayCompletion(dayCode: string): DayCompletion {
  return { day_code: dayCode, state: "not_started", entry_done: false, post_done: false };
}

export const NOTIFICATIONS: Notification[] = [];

/** Số liệu 4 stat card trên dashboard (bản gốc tính từ nhiều nguồn). */
export const DASHBOARD_STATS = {
  courseCount: 1,
  flashcardsViewed: 0,
  tutorQuestions: 17,
  averageProgressPercent: 61,
};
