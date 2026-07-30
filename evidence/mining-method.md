# Mining log — Check hiểu nhanh sau phản hồi Tutor

## Phạm vi

- Nguồn: `data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv`.
- Đơn vị đếm: một tin nhắn có `role = student` hoặc một phản hồi có `role = tutor`.
- Quy mô file: 1.261 tin nhắn học viên và 1.261 phản hồi Tutor (1.261 turn).

## Quy tắc đếm có thể lặp lại

1. **Nêu trực tiếp chưa hiểu:** đếm tin nhắn học viên có ít nhất một cụm, không phân biệt hoa/thường: `không hiểu`, `chưa hiểu`, `chưa rõ`, `khó hiểu`.
   - Kết quả tự động ban đầu: **10/1.261**.
2. **Yêu cầu giải thích rõ/chi tiết:** đếm tin nhắn có một trong các pattern: `hiểu rõ hơn`, `giải thích.*chi tiết`, `giải thích.*rõ`.
   - Kết quả tự động ban đầu: **20/1.261**.
3. **Tutor chủ động kiểm tra hiểu:** đếm phản hồi Tutor có `asked_check_question = True`.
   - Kết quả: **3/1.261**.
4. **Metadata follow-up/misconception:** đếm phản hồi Tutor có giá trị khác `[]` trong các trường tương ứng.
   - Kết quả: **0/1.261** cho mỗi trường.

> Hạn chế: pattern từ khoá chỉ là tín hiệu sàng lọc, không đồng nghĩa toàn bộ pain. Trước CP4, nhóm phải đọc thủ công tối thiểu 30–50 mẫu, lập quy tắc phân loại cuối cùng và ghi kết quả khảo sát ≥20 người ngoài nhóm.

## Ví dụ ngắn (mã turn thay cho dữ liệu dài)

| Mã turn | Tín hiệu từ học viên |
|---|---|
| `T1100` | “Tui không hiểu” |
| `T0902` | “sự khác nhau giữa ML và DL chưa rõ lắm” |
| `T0638` | “mình chưa hiểu về RAG” |
| `T0089` | “tôi không hiểu ... là cái gì” |
| `T0525` | “tôi chưa hiểu lắm ...” |

## Lệnh tái lập kết quả

```powershell
$r = Import-Csv -Encoding utf8 data\vlearn-pack\chatlog\chat_history_anonymized_for_hackathon.csv
$s = $r | Where-Object role -eq 'student'
($s | Where-Object { $_.content -match 'không hiểu|chưa hiểu|chưa rõ|khó hiểu' }).Count
($s | Where-Object { $_.content -match 'hiểu rõ hơn|giải thích.*chi tiết|giải thích.*rõ' }).Count
($r | Where-Object { $_.role -eq 'tutor' -and $_.asked_check_question -eq 'True' }).Count
```
