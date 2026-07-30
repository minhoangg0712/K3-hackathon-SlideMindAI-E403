# Bằng chứng: 8 điểm yếu của AI Assistant VLearn bản gốc

Thư mục này giữ **bundle JavaScript production** của `https://www.vlearn.dev` tại thời điểm khảo sát, cùng script trích 8 đoạn code làm căn cứ cho phần "vấn đề" trong bài pitch.

Mục đích: mọi khẳng định trong pitch đều **tự kiểm chứng được**. Không ai phải tin slide.

## Tự kiểm chứng

```bash
node evidence/verify.mjs        # in cả 8 điểm
node evidence/verify.mjs 7      # chỉ điểm 7
```

Script chỉ đọc file và cắt chuỗi — không sửa gì, không gọi mạng.

## Nguồn

| | |
|---|---|
| Ngày tải | 30/07/2026 |
| Cách lấy | Mở `https://www.vlearn.dev/course/comp2010/reader` bằng tài khoản học viên, lưu các chunk JS mà Next.js nạp |
| Chunk chính | `js/5615.e2b0eefb29fafcbe.js` — 167.183 ký tự, chứa toàn bộ trình đọc + AI Assistant |
| Kèm theo | 27 chunk khác + 2 file CSS, để đối chiếu chéo (ví dụ: xác nhận `search_slides` là tên tool **duy nhất** trong toàn app) |

Bundle đã qua minify nên tên biến là `e`, `t`, `r`… Đây là code chạy thật trên máy người dùng, không phải mã nguồn.

Muốn lấy lại từ đầu: mở DevTools → Network → lọc `.js` → lưu các file trong `_next/static/chunks/`. Tên chunk chứa hash nên **sẽ đổi khi VLearn deploy bản mới** — đó chính là lý do phải giữ bản sao này trong repo.

## Tóm tắt 8 điểm

| # | Vấn đề | Đoạn code |
|---|---|---|
| 1 | Confidence là hằng số | `confidence:n.length?.85:.6` |
| 2 | Citation parse bằng regex trên prose | `/\[trang (\d+)\]\s*([^\n]+)/g` → `document_title:""`, `section:null` |
| 3 | Ngữ cảnh gửi lên cực mỏng | `tools:[],context:[]` |
| 4 | Không có memory, không có cache | `memory_used:!1,cache_hit:!1` |
| 5 | Quota đếm ở client | `localStorage`, `maxLimit:15` |
| 6 | Hội thoại mất khi đóng tab | `sessionStorage` + key `edupulse_chat_conversation` |
| 7 | Chỉ một tool, giới hạn trong một day | `"search_slides"===r.toolCallName` |
| 8 | Câu hỏi bị cắt câm | `(…prefix + câu hỏi).slice(0,2e3)` |

Điểm 1 và 4 nằm **trong cùng một câu lệnh** — tiện cho slide:

```js
i = { message_id:l, answer:s, citations:n,
      confidence: n.length ? .85 : .6,
      status:"answered", conversation_id:a,
      memory_used: !1, cache_hit: !1 };
```

### Điểm 8 — chi tiết đáng chú ý

```js
let r = ((e.selected_text?.trim()
  ? `(Trang ${e.page_number}, đoạn được chọn: "${e.selected_text.trim().slice(0,300)}")\n`
  : `(Trang ${e.page_number})\n`) + (e.user_question || "")).slice(0, 2e3);
```

Prefix ghép vào **đầu** chuỗi rồi mới cắt 2000 ký tự → phần mất là **đuôi câu hỏi của người dùng**. Đã kiểm: `2e3` xuất hiện đúng 1 lần trong chunk, `maxLength` 0 lần. Ô nhập không giới hạn, không đếm ký tự, không cảnh báo.

## Một điều phải nói cho đúng

Bundle production còn nguyên một nhánh trả lời **viết sẵn**: 4 câu trả lời tiếng Việt hardcode cho "gradient descent" / "learning rate" / "tối ưu", kèm `flashcard`, `mindmap`, `algorithm_simulator`, và hiệu ứng gõ chữ giả bằng `setInterval(...,20)`.

**Nhưng nó là dead code.** Chỉ chạy trong nhánh `catch`/`onError`, và cờ điều khiển trả về `false` cứng:

```js
76503:(e,t,a)=>{a.d(t,{A:()=>r});function r(){return!1}}
```

Người dùng thật không bao giờ thấy nó. Khi API lỗi, họ nhận `"AI hiện không thể trả lời. Vui lòng thử lại sau ít phút."`

→ Cách nói đúng khi pitch: *chế độ demo scripted đã tắt trong production, nhưng code vẫn nằm trong bundle gửi tới trình duyệt mọi người học — bật lại chỉ cần đổi một ký tự.*

→ **Không** nói "AI của họ là giả". Sai, và một giám khảo biết đọc bundle sẽ bác ngay — kéo đổ luôn uy tín của 8 điểm ở trên. Không đáng đánh đổi.

## Ghi chú

Bundle này thuộc về VLearn, giữ ở đây **chỉ để kiểm chứng các khẳng định kỹ thuật trong bài thi**. Không tái phân phối, không dùng cho mục đích nào khác.
