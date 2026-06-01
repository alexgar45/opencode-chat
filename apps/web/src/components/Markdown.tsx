import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type Props = {
  content: string;
};

export function Markdown({ content }: Props) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
