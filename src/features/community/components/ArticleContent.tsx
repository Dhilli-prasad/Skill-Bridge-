import type { ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-violet-700">{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

export function ArticleContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.startsWith('```')) {
      const code: string[] = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index])
        index += 1
      }
      blocks.push(<pre key={`code-${index}`} className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{code.join('\n')}</code></pre>)
    } else if (line.startsWith('### ')) {
      blocks.push(<h3 key={index} className="text-xl font-bold text-slate-950">{inline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={index} className="text-2xl font-bold text-slate-950">{inline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      blocks.push(<h1 key={index} className="text-3xl font-bold text-slate-950">{inline(line.slice(2))}</h1>)
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/, ''))
        index += 1
      }
      blocks.push(<ol key={`ol-${index}`} className="list-decimal space-y-2 pl-6">{items.map((item) => <li key={item}>{inline(item)}</li>)}</ol>)
      continue
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(lines[index].slice(2))
        index += 1
      }
      blocks.push(<ul key={`ul-${index}`} className="list-disc space-y-2 pl-6">{items.map((item) => <li key={item}>{inline(item)}</li>)}</ul>)
      continue
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote key={index} className="border-l-4 border-indigo-300 pl-4 italic text-slate-600">{inline(line.slice(2))}</blockquote>)
    } else if (line.trim()) {
      blocks.push(<p key={index}>{inline(line)}</p>)
    }
    index += 1
  }
  return <div className="prose-like space-y-5 text-base leading-8 text-slate-700">{blocks}</div>
}
