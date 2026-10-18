import type { CSSProperties } from 'react'

// Keep the complete sentence accessible and reserve its final layout while typing.
export default function BuildText({ text, delay = 0, speed = 24 }: { text: string; delay?: number; speed?: number }) {
  return <span className="jv-build-text"><span className="jv-screen-reader">{text}</span><span aria-hidden="true">{Array.from(text).map((character, index) => <span key={index} className="jv-build-character" style={{ '--type-delay': `${delay + index * speed}ms` } as CSSProperties}>{character}</span>)}</span></span>
}
