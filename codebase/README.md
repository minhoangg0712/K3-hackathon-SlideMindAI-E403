# VLearn Tutor — cải tiến AI Assistant của VLearn

Bản dựng lại giao diện VLearn (`https://www.vlearn.dev`) chạy độc lập, dùng làm nền để cải tiến trợ lý học tập **VLearn Tutor** cho hackathon Day 5–6, khóa VinUni AI Thực Chiến.

> **Thành viên & phân công** — điền trước khi nộp:
>
> | Thành viên | Mã học viên | Vai trò | Phần phụ trách |
> |---|---|---|---|
> | | | Product/PM | |
> | | | AI Engineer | |
> | | | Full-stack | |

## 1. Chạy thử

```powershell
npm install
npm run setup          # copy worker/font pdfjs + sinh slide placeholder
Copy-Item .env.example .env.local
# mở .env.local, điền ANTHROPIC_API_KEY
npm run dev
```

Mở `http://localhost:3000` → `/dashboard` → `Khóa học của tôi` → `COMP2010` → `Đọc Slide`.

**Không có API key** thì Tutor tự chạy provider `mock`: nó chỉ ghép lại các đoạn slide tìm được, **không gọi model nào**, và mọi câu trả lời bị gắn nhãn `MOCK` trên giao diện. Mock chỉ để phát triển/demo offline — không được trình bày như AI chạy thật.

Lệnh khác: `npm run typecheck`, `npm run build`, `npm run lint`.

## 2. Slide dùng để demo

PDF gốc của khóa nằm sau đăng nhập nên repo không có. `npm run setup:slides` sinh placeholder đúng số trang cho từng học liệu, **không ghi đè file đã có** — thả slide thật vào `public/materials/<material_id>.pdf` là nó được dùng ngay. Ánh xạ `material_id` ↔ tên file xem `data/fixtures.ts`.

## 3. Kiến trúc

```
app/
  layout.tsx                     next/font Be Vietnam Pro, provider theme + i18n
  (student)/                     có AppHeader
    dashboard/  my-courses/  course/[courseId]/
  course/[courseId]/reader/      toàn màn hình, không AppHeader
  api/backend/api/v1/**          mock backend, mirror path VLearn thật 1:1
components/  layout/ dashboard/ course/ reader/
lib/
  api-client.ts    apiUrl/apiFetch qua prefix /api/backend
  agui.ts          AG-UI protocol qua SSE
  slide-index.ts   trích text từng trang PDF + tìm đoạn liên quan
  tutor-client.ts  gọi tutor, quota, feedback
  i18n.ts          bảng VI/EN
data/fixtures.ts   dữ liệu COMP2010 (id/lecture_id/material_id/page_count đều là giá trị thật)
```

Frontend giữ nguyên path và shape response của backend VLearn thật, nên có thể trỏ sang backend thật chỉ bằng `NEXT_PUBLIC_API_PREFIX`, và phần tutor cải tiến drop-in thay được backend gốc.

## 4. Lời gọi AI

- Endpoint: `POST /api/backend/api/v1/tutor/agent` — `app/api/backend/api/v1/tutor/agent/route.ts`.
- Model: `claude-opus-5` qua `@anthropic-ai/sdk`, streaming + adaptive thinking, `effort: medium`.
- Giao thức: **AG-UI qua SSE**, cùng shape bản gốc: `RUN_STARTED` → `TOOL_CALL_*` → `TEXT_MESSAGE_CONTENT` (từng chữ) → `STATE_SNAPSHOT` → `RUN_FINISHED` / `RUN_ERROR`.
- Truy hồi: `search_slides` đọc text layer của chính file PDF đang mở (`lib/slide-index.ts`), chấm điểm theo token trùng, cộng điểm cho trang người học đang xem, luôn kèm trang hiện tại.
- Dấu hiệu kiểm chứng khi demo: badge `Claude · live` cạnh câu trả lời (không phải `MOCK`); `STATE_SNAPSHOT.provider === "anthropic"` và `snapshot.usage` có token thật; terminal không log `[slide-index]` lỗi.

## 5. Điểm yếu của bản gốc và hướng đã xử lý

Trích trực tiếp từ bundle JS của `vlearn.dev`:

| Bản gốc | Bản này |
|---|---|
| `confidence: citations.length ? 0.85 : 0.6` — hardcode | Tính từ độ khớp thật: số token trùng + số trang chứng cứ (`confidenceFrom`) |
| Citation parse bằng regex `/\[trang (\d+)\]\s*([^\n]+)/g` trên text tool, `document_title` rỗng | Citation dựng từ chỉ mục slide, có `document_title`, `page`, `quote` là substring thật của slide |
| Ngữ cảnh chỉ là `(Trang N)` + 300 ký tự bôi đen nhồi vào chuỗi câu hỏi; `tools: []`, `context: []` | Ngữ cảnh đi trong `forwardedProps.scope`; server tự nạp nội dung slide liên quan vào `<slide_context>` |
| Chỉ tìm trong tài liệu của day đó → hay trả lời "trong tài liệu không đề cập" | Prompt tách rõ: ưu tiên slide, nhưng được bổ sung kiến thức nền và **nói rõ phần nào ngoài slide** |
| `conversation_id` ở `sessionStorage` → đóng tab là mất | `localStorage` |
| `memory_used`/`cache_hit` hardcode `false` | Prompt caching bật trên system prompt; `usage.cache_read_input_tokens` trả về thật |

**Còn hardcode ở client, chưa xử lý:** quota vẫn đếm bằng `localStorage` (`vlearn_quota_<email>_<ngày>`, tối đa 15) như bản gốc — clear storage là reset. Cần chuyển sang server nếu muốn tính đúng.

## 6. Phạm vi đã cắt

Có ở bản gốc, **không** dựng lại: bút/highlight/note trên PDF, flashcard, confusion detection, che nội dung khi rời tab, watermark email, lịch sử hội thoại, BYOK thật (chỉ có dialog thông báo như bản gốc), trang `study-overview`, đăng nhập.

## 7. Việc còn lại trước khi nộp

- [ ] Điền thông tin thành viên và phân công.
- [ ] `spec.md` — bài toán, lát cắt MVP, quality bar, giả định/rủi ro.
- [ ] `eval/golden_set.jsonl` + `eval/rubric.md` + `eval/results/` có ngày giờ.
- [ ] `validation/feedback-log.md` — tối thiểu 3 user test.
- [ ] `reflection/` — phản tư từng thành viên.
- [ ] `demo-slides.md` → xuất `demo-slides.pdf`.
- [ ] Chạy `AI_PROVIDER` thật trên máy demo, chụp ảnh response có badge `Claude · live`.
