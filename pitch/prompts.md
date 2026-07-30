# Prompt dùng khi demo — copy nguyên văn

Chép sẵn vào clipboard manager trước khi lên. Đừng gõ tay trên sân khấu.

---

## P1 — Câu có căn cứ trong slide (dùng cho demo ④ confidence)

```
Slide này định nghĩa khái niệm chính là gì?
```

Kỳ vọng: trả lời được, thanh confidence hiện **85%**.

---

## P2 — Câu không có trong slide (dùng cho demo ④ và ⑤)

```
Slide này nói gì về chuẩn hóa trong SVD?
```

Kỳ vọng: "trong tài liệu của bài học này không đề cập", confidence **60%**.

Đây là câu đã tái hiện được lỗi khi nhóm thử tutor gốc — dùng chính nó, đừng đổi.

---

## P3 — Khái niệm nền của chính slide (dùng cho demo ⑤ một tool)

Bôi đen một thuật ngữ tiếng Anh trên slide trước, rồi hỏi:

```
Giải thích kỹ hơn khái niệm tôi vừa bôi đen, phần này tôi chưa hiểu.
```

Kỳ vọng: hoặc trả lời hời hợt theo đúng chữ trên slide, hoặc nói không đề cập — cả hai đều minh hoạ được việc tool bị khoá trong một tài liệu.

**Dự phòng nếu nó trả lời tốt:** chuyển sang nói bằng code (`verify.mjs 7`) thay vì cố ép demo. Đừng nói "nó luôn luôn sai" khi vừa thấy nó trả lời đúng.

---

## P4 — Câu dài 2.400 ký tự (dùng cho demo ③ cắt câm)

Câu hỏi thật nằm ở **dòng cuối cùng**. Sau khi gửi, mở Network → Payload → cuộn xuống cuối `content` để chỉ ra nó đã biến mất.

```
Tôi đang làm bài tập cuối khoá và cần chọn kiến trúc cho sản phẩm của nhóm mình, nên tôi sẽ mô tả kỹ bối cảnh trước khi hỏi để bạn có đủ thông tin trả lời chính xác nhất. Nhóm tôi gồm năm người, thời gian còn lại khoảng hai tuần, và chúng tôi đang xây một trợ lý trả lời câu hỏi cho sinh viên dựa trên tài liệu môn học. Hiện tại tài liệu gồm khoảng mười hai file PDF, tổng cộng gần bảy trăm trang, chủ yếu là slide bài giảng có nhiều bảng biểu và sơ đồ, một số trang gần như chỉ có hình. Người dùng mục tiêu là sinh viên năm hai và năm ba, họ thường hỏi những câu rất ngắn, hay gõ tắt, không dấu, và thỉnh thoảng trộn tiếng Anh với tiếng Việt trong cùng một câu. Chúng tôi đã thử một phiên bản đơn giản chỉ nhồi toàn bộ nội dung trang hiện tại vào prompt rồi gọi model, nhưng gặp ba vấn đề. Thứ nhất là chi phí token tăng rất nhanh khi số người dùng đồng thời tăng lên, vì mỗi lượt đều gửi lại toàn bộ nội dung trang. Thứ hai là chất lượng câu trả lời không ổn định, có lúc model bám sát tài liệu, có lúc nó tự bịa thêm chi tiết không có trong slide, và chúng tôi không có cách nào phát hiện tự động. Thứ ba là khi sinh viên hỏi một khái niệm nền được nhắc ở slide này nhưng giải thích ở slide buổi khác, hệ thống trả lời là tài liệu không đề cập, trong khi thông tin đó thực sự có trong khoá học, chỉ nằm ở file khác. Chúng tôi đã cân nhắc vài hướng: một là xây một pipeline truy hồi có chấm điểm rồi chỉ đưa các đoạn liên quan nhất vào prompt, hai là để model tự gọi công cụ tìm kiếm theo từng bước và quan sát kết quả trước khi trả lời, ba là giữ nguyên cách nhồi trang nhưng thêm một bước kiểm tra sau khi model trả lời xong. Mỗi hướng đều có đánh đổi về độ trễ, chi phí và độ phức tạp khi triển khai, và với hai tuần còn lại chúng tôi không đủ thời gian thử cả ba rồi mới chọn. Về mặt hạ tầng, chúng tôi đang chạy trên gói miễn phí của một nhà cung cấp model, hạn mức theo phút và theo ngày đều khá chặt, nên mọi phương án tiêu thêm một lượt gọi cho mỗi câu hỏi đều phải cân nhắc rất kỹ. Về phía người dùng, chúng tôi quan sát thấy nhiều sinh viên hỏi lại gần như cùng một câu trong vòng vài phút, có khi chỉ khác cách viết hoa hoặc dấu câu, nên có thể có dư địa để tiết kiệm nếu xử lý được phần trùng lặp này. Ngoài ra, một số bạn có thói quen bôi đen cả một đoạn dài rồi mới đặt câu hỏi rất ngắn phía sau, trong khi một số bạn khác lại gõ một đoạn mô tả rất dài mà không bôi đen gì cả, và hai kiểu hành vi này dường như cần cách xử lý ngữ cảnh khác nhau. Chúng tôi cũng chưa quyết được nên đo chất lượng bằng cách nào cho khách quan, vì nếu tự chấm bằng chính model đang dùng thì có nguy cơ thiên vị, còn nếu chấm tay toàn bộ thì không kịp thời gian với số lượng câu hỏi cần kiểm. Vậy câu hỏi cuối cùng của tôi là: dựa trên nội dung slide này, nên chọn chatbot hay agent cho bài toán trên, và vì sao?
```

Sau khi ghép prefix `(Trang N)\n` và cắt ở 2.000 ký tự, **toàn bộ câu hỏi thật ở dòng cuối biến mất** — thứ còn lại chỉ là phần mô tả bối cảnh. Kiểm chứng lại bất cứ lúc nào bằng:

```bash
node pitch/check-p4.mjs
```

---

## P5 — Câu vi phạm liêm chính (dự phòng, chỉ dùng nếu giám khảo hỏi)

```
Cho tôi đáp án bài kiểm tra cuối buổi, chọn A B C hay D?
```

Dùng để so sánh hành vi bản gốc với bản của nhóm. Không nằm trong kịch bản chính.

---

## Lệnh Console — copy nguyên văn

### Xem bộ đếm quota

```js
Object.keys(localStorage).filter(k => k.startsWith("vlearn_quota")).map(k => [k, localStorage[k]])
```

### Xoá quota (demo ①)

```js
Object.keys(localStorage).filter(k => k.startsWith("vlearn_quota")).forEach(k => localStorage.removeItem(k))
```

Rồi F5.

### Xem hội thoại đang lưu ở đâu (demo ⑧)

```js
Object.keys(sessionStorage).filter(k => k.includes("edupulse_chat_conversation"))
```

> Trả về key có dữ liệu → chứng minh hội thoại nằm ở `sessionStorage`, đóng tab là mất.

---

## Lệnh terminal

```bash
node evidence/verify.mjs        # cả 8 điểm
node evidence/verify.mjs 5      # chỉ điểm 5 (quota)
node evidence/verify.mjs 8      # chỉ điểm 8 (cắt 2000)
```

---

## Việc phải làm trước ngày pitch

- [ ] Chạy thử P1 và P2 bằng **tài khoản khác**, xác nhận confidence đúng là 85% và 60%. Nếu VLearn đã sửa, bỏ demo ④ và chỉ nói bằng code.
- [ ] Chạy thử P4, chụp màn hình Payload bị cắt làm ảnh dự phòng.
- [ ] Xác nhận quota của tài khoản demo còn ít nhất 5 lượt.
- [ ] Chuẩn bị ảnh chụp màn hình cho cả 8 điểm, phòng khi mất mạng.
