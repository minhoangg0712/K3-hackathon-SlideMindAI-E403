import type { Curriculum } from "@/lib/types";
import type { DayEntry } from "@/components/course/DayCard";

/**
 * Chuyển curriculum của backend thành danh sách ngày học cho UI.
 * Bản gốc map chapter thứ n sang day code "day-0n" và endpoint completion
 * cũng dùng chính day code này.
 */
export function toDayEntries(curriculum: Curriculum): DayEntry[] {
  return curriculum.chapters
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((chapter, index) => ({
      dayCode: `day-${String(index + 1).padStart(2, "0")}`,
      title: chapter.title,
      slides: chapter.items
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          materialId: item.id,
          lectureId: item.lecture_id,
          title: item.title,
        })),
    }));
}
