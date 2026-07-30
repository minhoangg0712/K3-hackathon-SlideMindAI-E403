# VLearn Tutor — Trợ lý học tập có trích dẫn kiểm chứng được

> Bản cải tiến AI Assistant của nền tảng học tập VLearn. Prototype có **lời gọi AI thật** khi cấu hình `GEMINI_API_KEY`; chế độ `mock` chỉ là phương án dự phòng để demo giao diện khi chưa có API key.

---

# 1. Đội ngũ & phân công

| Mã học viên | Thành viên | Vai trò | Phụ trách |
|---|---|---|---|
| `2A202601803` | Lê Kim Nam | Leader | `spec.md` — bài toán, bằng chứng, lát cắt, quality bar |
| `2A202601627` | Nguyễn Quốc Hiệu | Data/AI Specialist | `validation/` — feedback log từ vòng user test |
| `2A202602036` | Nguyễn Khắc Huy | Developer | `codebase/`, `eval/` |
| `2A202601073` | Nguyễn Duy Lâm | Pitch/Business Specialist | `demo-slides.pdf` — câu chuyện giải pháp và demo, 6 trang |
| `2A202601609` | Nguyễn Minh Hoàng | Developer | `codebase/`, `eval/` |

## Deliverable và người chịu trách nhiệm

| # | Hạng mục | Người phụ trách | Trạng thái |
|---|---|---|---|
| 1 | `README.md` — thành viên, phân công | Huy | ✅ |
| 2 | `spec.md` — bài toán, bằng chứng, lát cắt, quality bar | Nam | ⬜ |
| 3 | `demo-slides.pdf` — 6 trang | Lâm | ⬜ |
| 4 | `codebase/` — prototype, ghi rõ phần nào là mock | Hoàng, Huy | 🔄 |
| 5 | `eval/` — golden set và kết quả các lượt chạy | Hoàng, Huy | ✅ 24 câu, 23/24 đạt |
| 6 | `validation/` — feedback log vòng user test | Hiệu | ⬜ |
| 7 | `reflection/` — mỗi thành viên một file | Cả nhóm | ⬜ chốt ngày mai |

> Trừ `codebase/` và slide, mọi tài liệu đều ở định dạng Markdown.

---

# 2. Bài toán & giải pháp

## VLearn Tutor

Học viên đọc slide bài giảng và hỏi trợ lý AI ngay trong trình đọc. Vấn đề không nằm ở chỗ AI trả lời được hay không — mà ở chỗ **học viên không có cách nào biết câu trả lời có đáng tin hay không**.

### Bằng chứng từ sản phẩm gốc

Bundle JavaScript production của `vlearn.dev` cho thấy tám điểm yếu, chạy `node evidence/verify.mjs` để tự kiểm chứng. Ba điểm nặng nhất:

```js
// Thanh tin cậy trên giao diện là hằng số, không đo gì cả
confidence: n.length ? .85 : .6, memory_used: !1, cache_hit: !1

// Trích dẫn parse bằng regex trên văn bản model tự viết, không đối chiếu slide
/\[trang (\d+)\]\s*([^\n]+)/g   // document_title:"", section:null

// Câu hỏi bị cắt âm thầm ở 2000 ký tự — phần mất là ĐUÔI câu người dùng gõ
((prefix) + user_question).slice(0, 2e3)
```

### Điều AI trong sản phẩm phải quyết định

> Câu hỏi của học viên **có trả lời được từ slide đang mở hay không**, và nếu có thì **trích đúng trang nào** — dùng `gemini-3.5-flash`.

### Đầu vào

- Câu hỏi tối đa **2.000 ký tự** (vượt thì báo rõ, không cắt âm thầm)
- Ngữ cảnh: tài liệu đang mở, số trang, đoạn văn bản học viên bôi đen

### Đầu ra

- 📝 Câu trả lời bám nội dung slide
- 🔍 Trích dẫn kèm số trang, đối chiếu được với văn bản gốc
- 📊 Độ tin cậy
- 🚫 Nói rõ "không đề cập" khi slide không có thông tin, thay vì bịa

### Đối tượng sử dụng

- Học viên đang đọc slide bài giảng
- Giảng viên muốn biết học viên hay mắc ở đâu

### Không sử dụng cho

- Làm hộ bài tập tính điểm, bài kiểm tra
- Nguồn trích dẫn duy nhất cho bài nộp

> Câu trả lời của AI luôn cần đối chiếu lại với slide gốc. Đó là lý do mọi trích dẫn đều kèm số trang.

Tiêu chí đánh giá MVP mô tả trong **[spec.md](spec.md)**.

---

# 3. Chạy Prototype

## Yêu cầu

- Node.js **20.11+** (khuyến nghị 22+)
- `GEMINI_API_KEY` — lấy miễn phí tại https://aistudio.google.com/apikey

Không cần Docker, không cần database server.

## Cài đặt

```powershell
cd codebase

npm install

npm run setup          # copy asset pdfjs

Copy-Item .env.example .env.local
```

Mở file `.env.local`

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL_CASCADE=gemini-3.5-flash,gemini-3.5-flash-lite
```

Kiểm tra key và xem model nào còn khả dụng

```powershell
node --env-file=.env.local scripts/check-gemini.mjs
```

Khởi chạy

```powershell
npm run dev
```

Truy cập

```
http://localhost:3000
```

Đường đi demo: `/dashboard` → **Khóa học của tôi** → **COMP2010** → **Đọc Slide** → đặt câu hỏi ở panel Tutor bên phải.

---

# 4. Gọi AI thật

Khi có `GEMINI_API_KEY`, endpoint

```
POST /api/backend/api/v1/tutor/agent
```

gửi câu hỏi và nội dung slide liên quan tới **Google Gemini API**, trả về theo giao thức **AG-UI qua SSE** — câu trả lời hiện dần từng chữ, giống bản gốc.

Trên giao diện hiển thị **tên model thật** đã trả lời:

```
gemini-3.5-flash
```

Model được cấu hình dạng cascade: bậc trước hết quota hoặc lỗi thì tự tụt xuống bậc sau, và snapshot trả về cờ `degraded` để người dùng biết. Không có badge nào hardcode.

> Không commit file `.env.local` hoặc API Key lên GitHub.

---

## Chế độ Mock

Chưa có API Key thì đặt

```env
TUTOR_PROVIDER=mock
```

Chế độ này **không gọi model nào** — chỉ ghép lại các đoạn slide tìm được, và mọi câu trả lời bị gắn nhãn `MOCK` trên giao diện.

**Không được trình bày đây là AI thật trong buổi demo.**

### Phần nào đang là mock trong prototype

| Thành phần | Thật | Mock |
|---|---|---|
| Lời gọi model | ✅ Gemini API | chỉ khi thiếu key |
| Nội dung slide | ✅ PDF thật của khóa COMP2010 | — |
| Trích text từng trang | ✅ pdfjs đọc text layer | — |
| Backend dữ liệu khóa học | — | ⚠️ route mock trong `codebase/app/api/backend/`, mirror đúng path API thật |
| Danh sách khóa, học liệu, tiến độ | — | ⚠️ fixture tĩnh ở `codebase/data/fixtures.ts` |
| Đăng nhập | — | ⚠️ chưa có, dùng user cố định |
| Quota 15 câu/ngày | — | ⚠️ đếm ở `localStorage` phía client |

---

# 5. API

## Request

```http
POST /api/backend/api/v1/tutor/agent
```

```json
{
  "threadId": "conv_123",
  "runId": "run_456",
  "messages": [{ "role": "user", "content": "Vòng lặp ReAct gồm những bước nào?" }],
  "tools": [],
  "context": [],
  "forwardedProps": {
    "clientTurnKey": "turn_789",
    "scope": {
      "course_id": "COMP2010",
      "lecture_id": "Lecture_material_ms2044ey_k6uor3",
      "material_id": "material_ms2044ey_k6uor3",
      "page_number": 22
    }
  }
}
```

## Response — SSE, mỗi frame một event AG-UI

```
data: {"type":"RUN_STARTED","threadId":"conv_123","runId":"run_456"}
data: {"type":"TOOL_CALL_START","toolCallId":"tc_1","toolCallName":"search_slides"}
data: {"type":"TOOL_CALL_RESULT","toolCallId":"tc_1","content":"[trang 22] ReAct Loop..."}
data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"msg_1","delta":"Vòng lặp"}
data: {"type":"STATE_SNAPSHOT","snapshot":{
        "citations":[{"document_title":"day03...pdf","page":22,"quote":"..."}],
        "confidence":0.78,"status":"answered",
        "provider":"gemini","model":"gemini-3.5-flash","degraded":false,
        "usage":{"input_tokens":2841,"output_tokens":312}}}
data: {"type":"RUN_FINISHED","threadId":"conv_123","runId":"run_456"}
```

Câu hỏi dài hơn 2.000 ký tự trả về `400` kèm `{"detail":"question_too_long","limit":2000,"actual":2431}` — báo rõ thay vì cắt âm thầm.

---

# 6. Kiểm thử & đánh giá

Chạy bộ câu thử qua endpoint thật (cần `npm run dev` đang chạy)

```powershell
node eval/run.mjs                    # toàn bộ 24 câu
node eval/run.mjs --only=g10,g14     # vài câu
```

## Kết quả — 19/24 (79%) lượt đầu, 23/24 (96%) sau khi sửa

| Kiểu tình huống | Trước | Sau | Tổng |
|---|---:|---:|---:|
| Trả lời được từ slide | 9 | 9 | 10 |
| Thông tin không có trong tài liệu | 3 | 4 | 4 |
| Đòi thứ không được phép làm | 3 | 3 | 3 |
| Sai gây hậu quả thật cho người học | 4 | 4 | 4 |
| Câu mơ hồ, thiếu ngữ cảnh | **0** | **3** | 3 |

Chuẩn nhóm cam kết: **≥75% câu đạt, và không được bịa số liệu hay trích sai số trang dù chỉ một lần.** Cả hai lượt đều vượt ngưỡng và không vi phạm điều kiện cứng.

**Lỗ hổng lượt đầu:** fail sạch 3/3 câu mơ hồ (`cái này là gì`, `giải thích kỹ hơn phần vừa rồi`, `cho vd`) — Tutor tự chọn một khái niệm trên trang rồi giải thích thay vì hỏi lại. Sửa bằng một quy tắc ưu tiên cao trong system prompt: câu không nêu rõ đối tượng thì **cấm** trả lời nội dung, chỉ được hỏi lại dưới 40 từ và kết thúc bằng dấu hỏi. Kết quả 3/3.

Hai câu còn lại của lượt đầu (`g07`, `g12`) hoá ra là **lỗi của bộ chấm, không phải của sản phẩm**: câu trả lời đúng nhưng regex suy ra trạng thái bắt nhầm. Đã siết lại `inferStatus` trong `eval/run.mjs` và ghi rõ lý do trong comment.

Bảng đầy đủ: `eval/runs/BEFORE-*.md` và `eval/runs/AFTER-*.md`.

Các thư mục liên quan

```
eval/
```

- `golden_set.jsonl` — 24 câu, phủ 4 kiểu tình huống dễ sai
- `rubric.md` — điều kiện đạt và chuẩn cam kết
- `runs/` — bảng kết quả từng lượt, có đủ cả câu fail kèm nguyên văn câu trả lời

```
validation/
```

- Feedback từ vòng user test

```
reflection/
```

- Báo cáo reflection của từng thành viên

```
evidence/
```

- Bundle JavaScript production của `vlearn.dev` và script trích 8 đoạn code chứng minh điểm yếu bản gốc

---

# 7. Cấu trúc dự án

```text
.
├── README.md
├── spec.md
├── demo-slides.md
├── demo-slides.pdf
├── codebase/
├── eval/
├── evidence/
├── validation/
└── reflection/
```

Trong đó:

- **codebase/**: Prototype Next.js 16 + React 19 + Tailwind v4
- **eval/**: Bộ câu thử, cách chấm và kết quả các lượt chạy
- **evidence/**: Bằng chứng code của sản phẩm gốc, tự kiểm chứng bằng `node evidence/verify.mjs`
- **validation/**: Nhật ký user test
- **reflection/**: Báo cáo reflection của các thành viên

---

# 8. Checklist trước khi Demo

- [x] Cập nhật thông tin thành viên và phân công.
- [x] Cấu hình `GEMINI_API_KEY` và xác nhận model khả dụng.
- [x] Chạy bộ golden set và lưu kết quả vào `eval/runs/`.
- [ ] Chạy thử ít nhất một input thật trên máy demo.
- [ ] Chụp màn hình kết quả có tên model thật (không phải `MOCK`).
- [ ] Thực hiện tối thiểu 3 user test và cập nhật `validation/feedback-log.md`.
- [ ] Hoàn thiện `spec.md`.
- [ ] Hoàn thiện `demo-slides.md` và xuất `demo-slides.pdf` — 6 trang.
- [ ] Mỗi thành viên nộp một file trong `reflection/`.

---

# 9. Lưu ý

- Không commit API Key.
- Không commit file `.env.local`.
- File PDF slide và cơ sở dữ liệu nằm trong `.gitignore` — chạy `npm run setup` để sinh lại.
- Chỉ sử dụng chế độ `mock` khi cần demo giao diện hoặc kiểm thử offline.
- Luôn sử dụng chế độ `openai` trong buổi demo chính thức để chứng minh hệ thống có lời gọi AI thật.
````
