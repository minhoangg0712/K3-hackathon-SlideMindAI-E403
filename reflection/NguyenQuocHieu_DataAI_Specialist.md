# Reflection — Nguyễn Quốc Hiệu (Data/AI Specialist)

## Đóng góp
- Tôi phụ trách phần `validation/`, đặc biệt là việc chuẩn hoá cách ghi nhận feedback từ vòng user test trong `validation/feedback-log.md`.
- Tôi tập trung vào các tình huống dễ gây sai cho tutor: câu hỏi mơ hồ, câu hỏi không có trong slide, và các câu hỏi cần kiểm tra độ tin cậy của citation.
- Tôi cũng phối hợp rà soát các phản hồi sau test để nhóm biết nên siết prompt, chỉnh cách hỏi lại, hay giữ hành vi từ chối khi cần.

## Quyết định & lý do
- Quyết định quan trọng nhất của tôi là ưu tiên ghi nhận feedback theo kịch bản thay vì chỉ ghi cảm nhận chung chung.
- Lý do là sản phẩm AI chỉ thật sự hữu ích khi mình biết rõ nó sai ở đâu, sai trong loại câu hỏi nào, và người dùng mất niềm tin ở chỗ nào.
- Cách ghi log theo câu hỏi, provider/model, mức hữu ích, mức tin cậy và thay đổi sau test giúp team nối thẳng feedback của người dùng với hành động sửa sản phẩm.

## Điều học được / điều chưa tốt
- Tôi học được rằng validation không phải phần phụ của dự án, mà là nơi kiểm tra xem prompt, retrieval và citation có thực sự phục vụ người học hay không.
- Tôi cũng thấy rõ rằng chỉ nhìn vào câu trả lời đúng/sai là chưa đủ; với tutor học tập, cảm nhận về độ tin cậy và khả năng hỏi lại đúng lúc quan trọng không kém.
- Điều chưa tốt là nếu quy trình ghi nhận feedback không được chuẩn hoá sớm, nhóm rất dễ có test rời rạc và khó tổng hợp thành quyết định cải tiến cụ thể.

## Bước tiếp theo
- Mở rộng feedback log bằng thêm nhiều kịch bản thật hơn từ người dùng ngoài nhóm.
- Gắn từng phản hồi với hành động sửa cụ thể để lần kiểm thử sau đo được cải thiện rõ ràng.
- Tiếp tục theo dõi các trường hợp câu hỏi mơ hồ và câu hỏi ngoài phạm vi để hoàn thiện chính sách hỏi lại và từ chối của tutor.