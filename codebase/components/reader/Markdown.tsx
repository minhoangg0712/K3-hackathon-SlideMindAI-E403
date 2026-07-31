import { Fragment, type ReactNode } from "react";

/**
 * Renderer markdown tối giản cho câu trả lời của Tutor.
 *
 * Model trả về markdown (in đậm, danh sách đánh số, code inline) nhưng panel
 * đang in nguyên ký tự `**` và `- ` ra màn hình. Chỉ cần đúng những cú pháp
 * model thực sự dùng, nên tự dựng thay vì kéo thêm thư viện — và không đụng
 * `dangerouslySetInnerHTML`, mọi thứ đều là React node.
 *
 * Hỗ trợ: **đậm**, *nghiêng*, `code`, danh sách `-`/`*`/`1.`, và ngắt đoạn.
 */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;

/** Xử lý các dấu trong một dòng, trả về mảng node. */
function inline(text: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-slate-800 dark:text-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

interface Block {
  kind: "p" | "ul" | "ol";
  lines: string[];
}

/** Gom các dòng liền nhau cùng loại thành block, để danh sách ra đúng thẻ. */
function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line) {
      // Dòng trống ngắt block hiện tại.
      if (blocks.at(-1)?.lines.length) blocks.push({ kind: "p", lines: [] });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const kind: Block["kind"] = bullet ? "ul" : numbered ? "ol" : "p";
    const content = bullet?.[1] ?? numbered?.[1] ?? line;

    const last = blocks.at(-1);
    if (last && last.kind === kind && last.lines.length > 0) {
      last.lines.push(content);
    } else {
      blocks.push({ kind, lines: [content] });
    }
  }

  return blocks.filter((block) => block.lines.length > 0);
}

export function Markdown({ text }: { text: string }) {
  const blocks = toBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.kind === "p") {
          return (
            <p key={index} className="whitespace-pre-wrap break-words">
              {block.lines.map((line, at) => (
                <Fragment key={at}>
                  {at > 0 ? <br /> : null}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        }

        const List = block.kind === "ol" ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`space-y-1 pl-4 ${
              block.kind === "ol" ? "list-decimal" : "list-disc"
            } marker:text-slate-400`}
          >
            {block.lines.map((line, at) => (
              <li key={at} className="break-words">
                {inline(line)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
