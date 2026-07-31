# Reflection — Nguyễn Duy Lâm (`2A202601073`)

## 1. Trách nhiệm và minh chứng

Với vai trò **Pitch/Business Specialist**, tôi chịu trách nhiệm chuyển các kết quả kỹ thuật của nhóm thành một câu chuyện dễ hiểu đối với người dùng và ban giám khảo. Cụ thể, tôi:

- Xây dựng form khảo sát và các câu hỏi phỏng vấn để tìm hiểu mức độ tin tưởng của học viên đối với câu trả lời, citation và cách Tutor xử lý khi thiếu thông tin. Cấu trúc nhiệm vụ test và câu hỏi sau test được thể hiện tại [`validation/feedback-log.md`](../validation/feedback-log.md).
- Xây dựng nội dung demo deck 6 trang theo mạch **vấn đề → người dùng và MVP → giải pháp → demo thật → kết quả đánh giá → roadmap**. Minh chứng là [`demo-slides.md`](../demo-slides.md) và [`demo-slides.pdf`](../demo-slides.pdf).
- Chuẩn bị và thực hiện phần thuyết trình, bao gồm lời thoại, luồng demo trực tiếp, các câu hỏi thường gặp và phương án rút gọn khi thiếu thời gian. Minh chứng là [`pitch/script.md`](../pitch/script.md), [`pitch/demo-script.md`](../pitch/demo-script.md) và [`pitch/prompts.md`](../pitch/prompts.md).

## 2. Quyết định quan trọng nhất

Quyết định quan trọng nhất của tôi là **không trình bày sản phẩm như một danh sách tính năng**, mà tập trung toàn bộ câu chuyện vào một vấn đề có thể chứng minh: học viên không biết có nên tin câu trả lời của AI hay không.

Từ đó, tôi chọn đưa các bằng chứng và số đo lên trước, sau đó mới trình bày giải pháp với bốn trạng thái `answered`, `not_found`, `clarify`, `refused`. Cách kể này giúp ban giám khảo thấy rõ mối liên hệ giữa vấn đề, thiết kế sản phẩm, phần demo và kết quả đánh giá 24 test case; đồng thời làm nổi bật giá trị của citation có thể kiểm chứng thay vì chỉ nhấn mạnh rằng sản phẩm “có dùng AI”.

## 3. Điều chưa hiệu quả, nguyên nhân và cách sửa

Ở phiên bản đầu, tôi cố đưa quá nhiều chi tiết kỹ thuật và quá nhiều tình huống vào phần trình bày. Form khảo sát cũng có nguy cơ dùng câu hỏi quá chung hoặc dẫn dắt người trả lời. Điều này khiến pitch dài, khó giữ trọng tâm và phản hồi khảo sát có thể không phản ánh hành vi sử dụng thật.

Nguyên nhân là tôi muốn chứng minh đầy đủ mọi đóng góp của nhóm trong một khoảng thời gian rất ngắn. Tôi khắc phục bằng cách thu gọn deck còn 6 trang, giữ một luồng demo chính, chuẩn bị thêm bản pitch 2 phút và câu trả lời Q&A. Với khảo sát, tôi chuyển sang cho người dùng tự hoàn thành nhiệm vụ trước, sau đó hỏi các câu trung tính như điều gì khó chịu nhất, họ có tin câu trả lời/citation không và trong trường hợp nào họ sẽ dùng Tutor. Tôi cũng tách rõ phần nào dùng Gemini thật và phần nào là mock để tránh tạo kỳ vọng sai trong lúc demo.

## 4. Giả định sẽ kiểm chứng nếu có thêm một tuần

Nếu có thêm một tuần, tôi sẽ ưu tiên kiểm chứng giả định: **citation có số trang và hành vi chủ động hỏi lại hoặc từ chối sẽ làm học viên tin tưởng, sử dụng Tutor đúng cách hơn, thay vì khiến họ cảm thấy hệ thống kém hữu ích**.

Tôi sẽ thực hiện test có nhiệm vụ với ít nhất 20 học viên ngoài nhóm, so sánh hai phiên bản: một phiên bản luôn cố trả lời và một phiên bản chỉ trả lời khi có căn cứ. Các chỉ số chính gồm tỷ lệ phát hiện câu trả lời thiếu nguồn, mức độ hữu ích và tin tưởng theo thang 1–5, tỷ lệ hoàn thành nhiệm vụ, cùng ý định tiếp tục sử dụng. Kết quả này sẽ giúp nhóm quyết định mức độ “thận trọng” phù hợp của Tutor dựa trên hành vi người dùng thật thay vì chỉ dựa vào giả định nội bộ.
