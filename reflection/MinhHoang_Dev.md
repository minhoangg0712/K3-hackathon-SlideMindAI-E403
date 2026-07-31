# Reflection — Nguyễn Minh Hoàng (Developer)

## Đóng góp
- Tham gia phát triển prototype VLearn Tutor trong thư mục `codebase/`, tập trung vào trải nghiệm người dùng khi học viên đọc slide và đặt câu hỏi trực tiếp trong giao diện.
- Hỗ trợ xây dựng và tối ưu luồng tương tác giữa frontend, mock backend và logic tutor, đảm bảo người dùng có thể thấy rõ trạng thái câu trả lời, trích dẫn và ngữ cảnh tài liệu.
- Góp phần kiểm tra và chạy bộ đánh giá trong thư mục `eval/`, theo dõi các case golden set và hỗ trợ rà soát các tình huống high-risk như không tìm thấy thông tin, câu hỏi mơ hồ hoặc yêu cầu vượt phạm vi.
- Đồng hành trong việc chuẩn bị demo và ghi nhận những phần nào là mock, phần nào đã dùng AI thật để tránh nhầm lẫn trong buổi trình bày.

## Quyết định & lý do
- Tôi chọn tập trung vào một slice rõ ràng: làm cho tutor trả lời có căn cứ, có trích dẫn và biết khi nào nên hỏi lại hoặc từ chối thay vì cố gắng trả lời mọi câu hỏi.
- Lý do là vì đây là ưu tiên đúng nhất với mục tiêu hackathon: sản phẩm cần thể hiện được giá trị thực tế, dễ demo và dễ kiểm chứng bằng test case.
- Tôi cũng đồng tình với quyết định dùng mock backend cho các phần chưa sẵn sàng, nhưng giữ phần AI call thật khi có API key, vì vậy demo có thể vừa ổn định vừa cho thấy khả năng của công nghệ.

## Điều học được / điều chưa tốt
- Học được rằng scope phải được cắt thật rõ từ đầu. Khi tập trung vào một chức năng cốt lõi và làm tốt nó, sản phẩm sẽ dễ thuyết phục hơn so với việc xây quá nhiều tính năng cùng lúc.
- Học được cách nhìn vào sản phẩm từ góc độ kiểm thử: một tính năng AI không chỉ cần “có vẻ đúng”, mà còn phải được chứng minh bằng trường hợp thực tế và phản hồi từ người dùng.
- Điều chưa tốt là ban đầu vẫn có xu hướng muốn làm nhiều thứ cùng lúc, dẫn đến việc mất thời gian cho các phần chưa phải ưu tiên nhất. Tôi cần rèn kỹ năng ưu tiên và chia nhỏ công việc hơn.
- Ngoài ra, việc kiểm tra end-to-end trước demo là rất quan trọng, vì lỗi nhỏ ở UI hoặc API có thể làm giảm cảm nhận về chất lượng sản phẩm.

## Bước tiếp theo
- Cải thiện độ ổn định của luồng tutor, đặc biệt ở phần citation, trạng thái trả lời và xử lý câu hỏi mơ hồ.
- Mở rộng kiểm thử với nhiều tình huống thực tế hơn để tăng độ tin cậy cho sản phẩm.
- Tiếp tục tích hợp các cải tiến về prompt policy, retrieval và trải nghiệm người dùng để sản phẩm gần hơn với một giải pháp có thể dùng thực tế.
