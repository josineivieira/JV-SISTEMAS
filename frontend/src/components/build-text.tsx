// Keep the complete sentence accessible and reserve its final layout while typing.
export default function BuildText({ text, elapsed, delay = 0, speed = 24 }: { text: string; elapsed: number; delay?: number; speed?: number }) {
  return <span className="jv-build-text"><span className="jv-screen-reader">{text}</span><span aria-hidden="true">{Array.from(text).map((character, index) => <span key={index} className="jv-build-character" style={{ visibility: elapsed >= delay + index * speed ? 'visible' : 'hidden' }}>{character}</span>)}</span></span>
}
