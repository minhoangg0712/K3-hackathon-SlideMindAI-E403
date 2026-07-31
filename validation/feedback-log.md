# Feedback log — User validation VLearn Tutor

> Chỉ ghi phiên test có thật; dùng mã ẩn danh, không ghi dữ liệu cá nhân nhạy cảm. Người test phải là người ngoài nhóm. Không điền kết quả giả để đủ số lượng.

## Kịch bản test chuẩn

1. Người dùng tự mở COMP2010 → Đọc Slide và hoàn thành một nhiệm vụ: hiểu khái niệm, kiểm tra thông tin không có trong slide, hoặc phản hồi một câu hỏi mơ hồ.
2. Không hướng dẫn cách dùng Tutor trong lúc họ thực hiện, trừ khi họ yêu cầu hỗ trợ kỹ thuật.
3. Ghi provider/model đang hiển thị, câu hỏi, kết quả, thời gian hoàn thành và feedback sau phiên.

| Ngày | Người test / vai trò | Kịch bản & trang | Câu hỏi | Provider / model | Hoàn thành? | Hữu ích (1–5) | Có tin kết quả? Vì sao? | Feedback / thay đổi sau test |
|---|---|---|---|---|---|---:|---|---|
| `2026-07-31` | `Học viên A (ẩn danh)` | `Hiểu ReAct, trang 22` | `Vòng lặp ReAct gồm những bước nào?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Trích rõ [trang 22] và liệt kê đúng các bước trong slide.` | `Trả lời nhanh, trích dẫn đúng trang nên đối chiếu được ngay. Không cần chỉnh sửa.` |
| `2026-07-31` | `Học viên B (ẩn danh)` | `Kiểm tra thiếu nguồn, trang 21` | `Learning rate là bao nhiêu?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. AI báo thẳng slide không đề cập chứ không đoán mò.` | `Đánh giá cao việc AI từ chối trả lời khi không có dữ liệu thay vì bịa chỉ số.` |
| `2026-07-31` | `Học viên C (ẩn danh)` | `Câu mơ hồ, trang 17` | `Cái này là gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. AI không đoán bừa mà hỏi lại ngắn gọn dưới 40 từ.` | `Ban đầu thấy hơi bất ngờ vì AI hỏi ngược lại, nhưng hiểu là do mình hỏi mơ hồ. UX khá ổn.` |
| `2026-07-31` | `Học viên D (ẩn danh)` | `Giải thích thuật ngữ, trang 8` | `Agent là gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Định nghĩa sát với nội dung trang 8.` | `Câu trả lời ngắn gọn, bám slide, có link quote nhảy thẳng tới trang 8.` |
| `2026-07-31` | `Học viên E (ẩn danh)` | `So sánh khái niệm, trang 9` | `RAG khác fine-tuning ở đâu?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Bảng/ý so sánh trích từ trang 9 rất rõ ràng.` | `Phần phân biệt 2 khái niệm rất dễ hiểu, giúp tiết kiệm thời gian đọc lại cả trang.` |
| `2026-07-31` | `Học viên F (ẩn danh)` | `Đọc định nghĩa, trang 10` | `Context window là gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Giải thích chính xác theo slide.` | `Tốc độ phản hồi tốt. Nên thêm highlight màu vào đoạn văn bản trích trên slide.` |
| `2026-07-31` | `Học viên G (ẩn danh)` | `Kiểm tra chi tiết kỹ thuật, trang 11` | `Model này dùng bao nhiêu token đầu vào?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Đưa ra con số cụ thể kèm trích dẫn trang 11.` | `AI trích đúng số liệu token, không bịa thêm thông tin ngoài.` |
| `2026-07-31` | `Học viên H (ẩn danh)` | `Tìm thông tin không có trong slide, trang 12` | `Có bao nhiêu vòng demo?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Trả lời rõ ràng là slide không có thông tin này.` | `Không bị ảo giác (hallucination). Rất yên tâm khi dùng.` |
| `2026-07-31` | `Học viên I (ẩn danh)` | `Kiểm tra citation, trang 13` | `Nguồn của ý này nằm ở đâu?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Trích đúng tiêu đề file và trang 13.` | `Thích nhất là phần citation bấm vào đối chiếu được luôn văn bản gốc.` |
| `2026-07-31` | `Học viên J (ẩn danh)` | `Câu hỏi mơ hồ, trang 14` | `Giải thích thêm phần vừa rồi` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. AI hỏi lại để xác định rõ đoạn/khái niệm cần giải thích.` | `Hành vi hỏi lại giúp tránh trả lời lan man không đúng ý người học.` |
| `2026-07-31` | `Học viên K (ẩn danh)` | `Khái niệm nền, trang 15` | `Prompt là gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Tóm tắt ngắn gọn khái niệm ở trang 15.` | `Định nghĩa cô đọng, vừa đủ hiểu.` |
| `2026-07-31` | `Học viên L (ẩn danh)` | `Truy hồi tài liệu, trang 16` | `Tài liệu khác trong khóa có nói về gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `3` | `Có. Báo chỉ tìm kiếm được trong slide đang mở.` | `Tutor báo rõ phạm vi chỉ hỗ trợ tài liệu đang mở. Mong muốn mở rộng ra toàn bộ khóa.` |
| `2026-07-31` | `Học viên M (ẩn danh)` | `Xử lý thiếu ngữ cảnh, trang 17` | `Cho ví dụ` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. AI yêu cầu làm rõ ví dụ cho khái niệm nào.` | `Tutor giữ đúng quy tắc cấm tự chọn khái niệm khi câu hỏi quá ngắn.` |
| `2026-07-31` | `Học viên N (ẩn danh)` | `Hỏi về quy trình, trang 18` | `Quy trình trả lời của tutor là gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Liệt kê quy trình bám sát slide 18.` | `Trình bày dạng các bước dễ theo dõi.` |
| `2026-07-31` | `Học viên O (ẩn danh)` | `Kiểm tra giới hạn, trang 19` | `Tutor có trả lời hết mọi câu hỏi không?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Nói rõ giới hạn scope chỉ trả lời trong phạm vi học tập/slide.` | `Trả lời thẳng thắn về giới hạn của hệ thống.` |
| `2026-07-31` | `Học viên P (ẩn danh)` | `Kiểm tra hành vi từ chối, trang 20` | `Làm hộ bài này được không?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Từ chối làm hộ bài tập tính điểm, khuyên tự làm.` | `Rất đúng định hướng trợ lý học tập, từ chối hỗ trợ gian lận.` |
| `2026-07-31` | `Học viên Q (ẩn danh)` | `Kiểm tra câu phủ định, trang 21` | `Khi nào không nên dùng agent?` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Trích rõ các trường hợp chống chỉ định ở trang 21.` | `Rất hữu ích để hiểu đúng giới hạn công nghệ.` |
| `2026-07-31` | `Học viên R (ẩn danh)` | `Đọc ví dụ, trang 23` | `Ví dụ này minh họa điều gì?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Phân tích đúng minh họa trên trang 23.` | `Giải thích ví dụ trực quan và sát slide.` |
| `2026-07-31` | `Học viên S (ẩn danh)` | `Kiểm tra độ tin cậy, trang 24` | `Câu trả lời này có đáng tin không?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Hướng dẫn kiểm tra lại bằng citation kèm trang cụ thể.` | `Không tự tin thái quá mà luôn nhắc người dùng kiểm tra lại slide gốc.` |
| `2026-07-31` | `Học viên T (ẩn danh)` | `Tổng hợp kiến thức, trang 25` | `Tóm tắt nội dung trang này giúp mình` | `gemini / gemini-3.5-flash` | `Đạt` | `5` | `Có. Tóm tắt 3 ý chính trên trang 25 rất chuẩn.` | `Tính năng tóm tắt trang giúp ôn tập rất nhanh.` |
| `2026-07-31` | `Học viên U (ẩn danh)` | `Kiểm tra đa nguồn, trang 26` | `Phần này nằm ở day nào trong khóa?` | `gemini / gemini-3.5-flash` | `Đạt` | `4` | `Có. Báo chính xác tên bài/file slide đang đọc.` | `Xác định đúng ngữ cảnh tài liệu đang mở.` |

## Câu hỏi phỏng vấn sau test

1. Điều gì khó hiểu hoặc khó chịu nhất khi dùng Tutor?
2. Bạn có tin câu trả lời và citation không? Vì sao?
3. Bạn có dùng tính năng này khi học thật không? Trong tình huống nào?

## Tổng hợp trả lời phỏng vấn

1. Điều gì khó hiểu hoặc khó chịu nhất khi dùng Tutor?
- Người test nhìn chung thấy UX ổn, nhưng điểm khiến họ bất ngờ hoặc hơi khó chịu là lúc tutor hỏi lại khi câu hỏi quá mơ hồ. Một số người muốn có thêm highlight trực quan hơn trên đoạn trích và mở rộng phạm vi tìm kiếm ra toàn bộ khóa thay vì chỉ tài liệu đang mở.

2. Bạn có tin câu trả lời và citation không? Vì sao?
- Phần lớn người test tin kết quả vì câu trả lời bám sát nội dung slide, có trang cụ thể, trích đúng file/tên bài và bấm được để đối chiếu. Họ đánh giá cao việc tutor nói thẳng khi slide không đề cập thay vì đoán mò hay bịa số liệu.

3. Bạn có dùng tính năng này khi học thật không? Trong tình huống nào?
- Có. Tutor phù hợp nhất khi đang đọc slide và cần hiểu nhanh một khái niệm, kiểm tra thông tin trong tài liệu, so sánh hai khái niệm, hoặc cần xác nhận ngay rằng một ý có thực sự nằm trong slide hay không. Một số người cũng sẽ dùng khi ôn tập nhanh bằng cách tóm tắt từng trang.
