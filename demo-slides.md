# Demo Deck — VLearn Tutor (6 slides)

> Bản nội dung nguồn để xuất `demo-slides.pdf`. Thay `THÊM_LINK_GITHUB` trước khi nộp.

---

# Slide 1. Vấn đề: học viên không biết có nên tin câu trả lời AI

- Học viên đọc slide trên VLearn và hỏi Tutor ngay trong lúc học.
- Bundle và chatlog của sản phẩm gốc cho thấy **582/1.261 phản hồi (46,2%) không có citation**.
- Một câu trả lời nghe hợp lý nhưng sai nguồn/sai trang có thể khiến người học hiểu sai hoặc trích dẫn sai.

**Mục tiêu:** Tutor chỉ trả lời khi có căn cứ, và chọn hành vi an toàn khi thiếu căn cứ.

---

# Slide 2. Người dùng, job và lát cắt MVP

**Người dùng:** học viên đang đọc slide khóa VinUni AI Thực Chiến trên VLearn.

**Job:** xác minh và hiểu đúng một thông tin trong tài liệu trước khi tiếp tục học hoặc làm bài.

**Lát cắt một câu:**

> Học viên hỏi về đoạn/tài liệu đang mở → Tutor truy hồi slide liên quan → trả về đúng một trong bốn trạng thái: `answered`, `not_found`, `clarify`, hoặc `refused`.

**Không làm trong MVP:** đăng nhập thật, lịch sử hội thoại đầy đủ, đồng bộ production, làm hộ bài nộp/kiểm tra.

---

# Slide 3. Giải pháp: VLearn Tutor có căn cứ

1. Học viên mở slide COMP2010, có thể bôi đen đoạn cần hỏi.
2. `search_slides` tìm text layer của PDF, ưu tiên trang đang xem.
3. Gemini tạo câu trả lời theo policy: không bịa, hỏi lại khi mơ hồ, từ chối yêu cầu vi phạm liêm chính.
4. UI hiển thị câu trả lời, trang nguồn, quote, confidence và tên model thực tế.

**Khác biệt:** citation được dựng từ chính slide đã truy hồi; không parse citation do model tự viết.

---

# Slide 4. Demo AI chạy thật

## Thiết lập

```env
GEMINI_API_KEY=YOUR_API_KEY
GEMINI_MODEL_CASCADE=gemini-3.5-flash,gemini-3.5-flash-lite
```

## Luồng demo

1. Chạy `npm run dev` và mở `http://localhost:3000`.
2. Đi theo `/dashboard` → COMP2010 → Đọc Slide.
3. Hỏi: **“Vòng lặp ReAct gồm những bước nào?”** tại trang 22.
4. Endpoint `POST /api/backend/api/v1/tutor/agent` gọi Google Gemini API qua SSE.
5. Kiểm chứng UI hiển thị **tên model thật**, citation trang 22 và không có nhãn `MOCK`.

---

# Slide 5. Đánh giá và validation

**Golden set: 24 câu**, gồm 5 nhóm: grounded (10), no-info (4), ambiguous (3), forbidden (3), harmful-if-wrong (4).

**Quality bar:** ≥75% case đạt và **100% case high-risk** không bịa số liệu/trích dẫn, không làm hộ hoặc đưa đáp án.

**Kết quả baseline 30/07/2026:** **19/24 (79%)**; 11/11 high-risk đạt.

- Điểm mạnh: no-info, forbidden và harmful-if-wrong được xử lý an toàn trong lượt baseline.
- Điểm cần sửa: 3/3 câu mơ hồ bị trả lời thay vì hỏi lại; sẽ bổ sung guard trước bước sinh câu trả lời.
- User test: tối thiểu 3 học viên ngoài nhóm, ghi nhiệm vụ, provider/model, feedback và thay đổi tại `validation/feedback-log.md`.

---

# Slide 6. Roadmap và lời mời demo

## MVP đã có

- Prototype Next.js chạy local; truy hồi text slide PDF.
- Gemini live khi có key; mock được gắn nhãn rõ ràng khi offline.
- Citation/quote, confidence, policy 4 trạng thái và eval 24 case.

## Tiếp theo

- Sửa guard câu hỏi mơ hồ và chạy lại golden set.
- Bổ sung ≥10 case phát triển từ chatlog/user test thật.
- User test, đồng bộ VLearn thật và lưu quota phía server.

**Repository:** `https://github.com/minhoangg0712/hackathon-VinAI`
