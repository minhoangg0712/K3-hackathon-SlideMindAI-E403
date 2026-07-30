````md
# AI Startup Demo – Insight Copilot

> Template repository công khai cho một dự án AI Hackathon. Prototype có **một lời gọi AI thật** khi cấu hình `OPENAI_API_KEY`; chế độ `mock` chỉ là phương án dự phòng để demo giao diện khi không có kết nối hoặc chưa có API key.

---

# 1. Đội ngũ & phân công

| Thành viên | Mã học viên | Vai trò | Phụ trách |
|------------|-------------|----------|-----------|
| `HỌ TÊN 1` | `MÃ SỐ` | Product Manager | Phân tích bài toán, User Testing, Pitch |
| `HỌ TÊN 2` | `MÃ SỐ` | AI Engineer | Prompt Engineering, Model Integration, Evaluation |
| `HỌ TÊN 3` | `MÃ SỐ` | Full-stack Developer | Backend API, Frontend, Deploy |

> **Lưu ý:** Thay toàn bộ `HỌ TÊN` và `MÃ SỐ` trước khi public repository.

---

# 2. Bài toán & giải pháp

## Insight Copilot

Insight Copilot giúp chuyển đổi các ghi chú cuộc họp hoặc văn bản dài thành những thông tin quan trọng và dễ hành động.

### Đầu vào

- Văn bản UTF-8 từ **20 – 8.000 ký tự**
- Có thể kèm theo một câu hỏi tùy chọn

### Đầu ra

Hệ thống sẽ trả về:

- 📝 Summary (Tóm tắt)
- ✅ Action Items (Việc cần làm)
- ⚠️ Risks (Rủi ro)
- 📌 Decisions (Quyết định quan trọng)
- 🔍 Evidence (Đoạn trích từ văn bản gốc)
- 📊 Confidence Score

### Đối tượng sử dụng

- Product Manager
- Founder
- Business Analyst
- Researcher

### Không sử dụng cho

- Tư vấn pháp lý
- Tư vấn y tế
- Tư vấn tài chính

> Output của AI chỉ mang tính hỗ trợ và luôn cần được kiểm chứng lại bằng dữ liệu gốc.

Thông tin chi tiết về tiêu chí đánh giá MVP được mô tả trong **spec.md**.

---

# 3. Chạy Prototype

## Yêu cầu

- Python 3.11+
- OpenAI API Key

## Cài đặt

```powershell
cd codebase

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

Copy-Item ..\.env.example .env
```

Mở file `.env`

```env
OPENAI_API_KEY=your_api_key
AI_PROVIDER=openai
```

Khởi chạy server

```powershell
uvicorn app.main:app --reload --port 8000
```

Truy cập

```
http://127.0.0.1:8000
```

Sau đó dán nội dung cuộc họp hoặc ghi chú vào giao diện để phân tích.

---

# 4. Gọi AI thật

Khi cấu hình

```env
AI_PROVIDER=openai
```

API

```
POST /api/analyze
```

sẽ gửi dữ liệu người dùng đến **OpenAI Responses API** để thực hiện phân tích.

Trên giao diện sẽ hiển thị badge

```
OpenAI • Live
```

để xác nhận đang sử dụng AI thật.

> Không commit file `.env` hoặc API Key lên GitHub.

---

## Chế độ Mock

Nếu chưa có API Key, có thể sử dụng

```env
AI_PROVIDER=mock
```

Chế độ này chỉ trả về dữ liệu giả lập nhằm kiểm thử giao diện và luồng xử lý.

**Không được trình bày đây là AI thật trong buổi demo.**

---

# 5. API

## Request

```http
POST /api/analyze
```

```json
{
  "text": "Nhóm thống nhất phát hành phiên bản Beta vào ngày 15/08...",
  "question": "Việc nào cần ưu tiên?"
}
```

## Response

```json
{
  "summary": "...",
  "decisions": [],
  "action_items": [],
  "risks": [],
  "evidence": [],
  "confidence": 0.92,
  "provider": "openai"
}
```

---

# 6. Kiểm thử & đánh giá

Chạy toàn bộ test

```powershell
cd codebase

python -m pytest

python scripts/run_eval.py
```

Các thư mục liên quan

```
eval/
```

- Golden Dataset
- Rubric đánh giá
- Kết quả Evaluation

```
validation/
```

- Feedback từ User Testing

```
reflection/
```

- Báo cáo Reflection của từng thành viên

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
├── validation/
└── reflection/
```

Trong đó:

- **codebase/**: Prototype FastAPI
- **eval/**: Bộ dữ liệu đánh giá và kết quả
- **validation/**: Nhật ký User Testing
- **reflection/**: Báo cáo Reflection của các thành viên

---

# 8. Checklist trước khi Demo

- [ ] Cập nhật thông tin thành viên và phân công.
- [ ] Cấu hình `AI_PROVIDER=openai`.
- [ ] Chạy thử ít nhất một input thật trên máy demo.
- [ ] Chụp màn hình kết quả có badge **OpenAI • Live**.
- [ ] Chạy bộ Golden Set và lưu kết quả vào `eval/results/`.
- [ ] Thực hiện tối thiểu 3 User Tests và cập nhật `validation/feedback-log.md`.
- [ ] Hoàn thiện `demo-slides.md` và xuất lại `demo-slides.pdf`.

---

# 9. Lưu ý

- Không commit API Key.
- Không commit file `.env`.
- Chỉ sử dụng chế độ `mock` khi cần demo giao diện hoặc kiểm thử offline.
- Luôn sử dụng chế độ `openai` trong buổi demo chính thức để chứng minh hệ thống có lời gọi AI thật.
````
