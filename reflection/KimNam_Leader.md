# Reflection — Lê Kim Nam (Leader)

## 1. Trách nhiệm và Minh chứng (Artifacts)

Với vai trò **Leader / Product Owner**, tôi chịu trách nhiệm chính về định hướng sản phẩm, phạm vi bài toán (scope management), tiêu chuẩn chất lượng (quality bar) và việc chốt định hình dự án.

Các minh chứng (artifacts) trực tiếp:
- **`spec.md`**: Trực tiếp biên soạn và duy trì toàn bộ bản mô tả kỹ thuật (`spec.md`), định hình bài toán VLearn Tutor, định nghĩa 4 lớp rủi ro (grounded - trả lời dựa trên tài liệu, no_info - không có thông tin, ambiguous - trả lời mơ hồ, forbidden - vi phạm quy định), xây dựng 6 nguyên tắc thiết kế AI (G1, G2, G8, G9, G10, G11), và thiết lập Quality Bar cho dự án.
- **`README.md`**: Quản lý phân công vai trò, theo dõi tiến độ các deliverable và quy chuẩn checklist trước khi demo.
- **`KimNam_Leader.md`**: File báo cáo phản tư cá nhân theo đúng cấu trúc yêu cầu của dự án.

---

## 2. Quyết định quan trọng nhất

Quyết định quan trọng nhất mà tôi đưa ra là **thay đổi hoàn toàn lát cắt sản phẩm (Core Slice) từ "Trợ lý check hiểu nhanh" sang "Tutor trả lời đáng tin cậy theo nguồn (Grounded & Responsible AI)"** ngay trước cột mốc CP4.

**Lý do & Bối cảnh:**
- Ban đầu, team có ý tưởng xây dựng tính năng tự động đặt câu hỏi kiểm tra độ hiểu của học viên.
- Tuy nhiên, khi phân tích tập dữ liệu 1.261 lượt chatlog từ sản phẩm gốc VLearn, tôi phát hiện ra **582/1.261 (46,2%)** câu trả lời hoàn toàn thiếu `citations`, và học viên cực kỳ hoang mang khi AI bịa đặt hoặc tự động trả lời cả khi thiếu ngữ cảnh.
- Bộ dữ liệu đánh giá (Golden Set 24 cases) đo đạc rất mạnh về khả năng trích dẫn, chống hallucination, xử lý câu hỏi mơ hồ và từ chối vi phạm liêm chính học thuật. Việc cố giữ tính năng "check hiểu" sẽ làm phân tán nguồn lực dev và không thể đo lường chính xác bằng Golden Set.
- Do đó, tôi quyết định bóp chặt Scope thành một lát cắt 1-câu sắc bén: *Phân loại chính xác 4 trạng thái (`answered`, `not_found`, `clarify`, `refused`) để đảm bảo câu trả lời luôn có căn cứ và đáng tin cậy.*

---

## 3. Điều không hiệu quả / Thất bại, Nguyên nhân & Cách sửa

### Điều không hiệu quả:
Ở lượt đánh giá đầu tiên (Baseline Run) trên bộ Golden Set 24 câu, hệ thống bị **fail 100% (0/3)** ở nhóm tình huống câu hỏi mơ hồ (`ambiguous` - các câu như *"cái này là gì"*, *"giải thích kỹ hơn phần vừa rồi"*, *"cho vd"*).

### Nguyên nhân:
System Prompt ban đầu bị thiết kế quá "hào hứng" trả lời: khi nhận câu hỏi mơ hồ, AI tự động đoán một khái niệm ngẫu nhiên trên trang slide đang mở rồi thao thao bất tuyệt giải thích, thay vì chủ động dừng lại để hỏi làm rõ (clarify) với học viên.

### Cách khắc phục:
Tôi đã họp gấp với team AI/Prompt (`Hiệu` & `Hoàng`), yêu cầu tái cấu trúc System Prompt theo nguyên tắc **G10 (Thu hẹp phạm vi khi nghi ngờ)**. Tôi bổ sung quy tắc ưu tiên cao nhất: *Nếu câu hỏi thiếu đối tượng hoặc thiếu ngữ cảnh cụ thể, cấm AI tự đoán; bắt buộc phải trả về `status: clarify`, hỏi lại bằng đúng 1 câu dưới 40 từ và kết thúc bằng dấu hỏi.*

**Kết quả:** Ở lượt chạy thứ 2 (After Fix), nhóm `ambiguous` đã tăng từ **0/3 lên 3/3 (100%)**, góp phần nâng tổng điểm Golden Set từ **79% (19/24) lên 96% (23/24)**.

---

## 4. Giả định cần kiểm chứng nếu có thêm 1 tuần

Nếu có thêm 01 tuần để phát triển dự án, tôi sẽ ưu tiên kiểm chứng giả định:

> **"Học viên chấp nhận việc AI chủ động từ chối (`not_found` / `clarify`) thay vì luôn cố đưa ra một câu trả lời dài dòng nhưng thiếu căn cứ."**

### Kịch bản kiểm chứng:
1. **Thiết lập A/B Testing (Multi-prototype) trên 30 sinh viên thật:**
   - **Biến thể A (Eager AI):** AI luôn cố gắng trả lời mọi câu hỏi dựa trên kiến thức chung (dù slide không đề cập hoặc câu hỏi mơ hồ).
   - **Biến thể B (Grounded/Conditional AI - Sản phẩm hiện tại):** AI kiên quyết trả về `not_found` khi slide không có thông tin, `clarify` khi câu hỏi cụ thể chưa rõ, và `refused` khi yêu cầu giải hộ bài tập.
2. **Tiêu chí đo lường (Metrics):**
   - Tỷ lệ học viên phát hiện ra thông tin sai (Accuracy Perception Rate).
   - Tỷ lệ học viên quay lại sử dụng công cụ trong các buổi học tiếp theo (Retention & Trust Score).
   - Mức độ hài lòng của học viên khi bị từ chối/hỏi lại (đo qua nhận xét định tính trong buổi User Testing).