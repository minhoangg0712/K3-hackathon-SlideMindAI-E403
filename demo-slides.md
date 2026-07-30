# Demo Deck – Insight Copilot

---

# Slide 1. Vấn đề

## Bài toán

Các ghi chú cuộc họp (Meeting Notes) thường:

- Dài và thiếu cấu trúc.
- Khó xác định quyết định cuối cùng.
- Dễ bỏ sót các công việc cần thực hiện.
- Khó theo dõi rủi ro sau cuộc họp.

### Mục tiêu

Giúp người dùng rút ra các insight quan trọng chỉ trong vài giây thay vì phải đọc toàn bộ nội dung.

---

# Slide 2. Người dùng & Insight

## Đối tượng sử dụng

- Product Manager
- Founder
- Business Analyst
- Research Team

## Nhu cầu

Người dùng muốn chuyển đổi một bản ghi chú thô thành:

- Quyết định quan trọng (Decisions)
- Việc cần làm (Action Items)
- Rủi ro (Risks)
- Tóm tắt ngắn gọn (Summary)

Điều quan trọng là mọi kết quả đều có **Evidence** (đoạn trích từ văn bản gốc) để dễ dàng kiểm chứng.

---

# Slide 3. Giải pháp

## Insight Copilot

Người dùng chỉ cần:

1. Dán nội dung cuộc họp.
2. (Tùy chọn) nhập câu hỏi cần AI tập trung.
3. Nhấn **Analyze**.

Hệ thống sẽ tự động phân tích và trả về:

- 📝 Summary
- 📌 Decisions
- ✅ Action Items
- ⚠️ Risks
- 🔍 Evidence
- 📊 Confidence Score

Tất cả kết quả đều được trình bày theo cấu trúc rõ ràng, dễ đọc và dễ kiểm chứng.

---

# Slide 4. Demo luồng chạy AI thật

## Quy trình

### Bước 1

Cấu hình:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=YOUR_API_KEY
```

### Bước 2

Mở ứng dụng web và dán nội dung Meeting Note.

### Bước 3

Frontend gọi API:

```http
POST /api/analyze
```

Backend sử dụng **OpenAI Responses API** để phân tích dữ liệu.

### Bước 4

Giao diện hiển thị:

- Badge **OpenAI • Live**
- Summary
- Decisions
- Action Items
- Risks
- Evidence
- Confidence

Qua đó chứng minh hệ thống đang sử dụng AI thật thay vì dữ liệu giả lập.

---

# Slide 5. Đánh giá & Validation

## Đánh giá mô hình

Sử dụng bộ **Golden Set** gồm 5 tình huống thực tế.

Các tiêu chí đánh giá:

- Summary đúng nội dung.
- Evidence chính xác.
- Action Items đầy đủ.
- Risks hợp lý.

## User Testing

Thực hiện kiểm thử với người dùng và ghi nhận:

- Mức độ dễ sử dụng.
- Độ hữu ích của kết quả.
- Các góp ý cải thiện hệ thống.

Toàn bộ kết quả được lưu trong thư mục:

```
eval/
validation/
```

---

# Slide 6. Roadmap & Demo

## Hoàn thành trong MVP

- Phân tích Meeting Notes.
- Sinh Summary.
- Trích xuất Decisions.
- Gợi ý Action Items.
- Phát hiện Risks.
- Trích dẫn Evidence.

## Hướng phát triển

- Hỗ trợ upload PDF, DOCX.
- Quản lý Workspace.
- Lưu lịch sử phân tích.
- Human Review trước khi xuất kết quả.
- Hỗ trợ nhiều mô hình AI.

---

## Repository

GitHub:

```
THÊM_LINK_GITHUB
```

## Demo

Quét QR Code hoặc truy cập GitHub để trải nghiệm Insight Copilot.