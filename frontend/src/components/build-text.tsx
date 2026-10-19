// Translators must not rewrite the individual character nodes while React reveals them.
// Keep this animated fragment in its original language; surrounding content stays translatable.
export default function BuildText({ text, elapsed, delay = 0, speed = 24 }: { text: string; elapsed: number; delay?: number; speed?: number }) {
  return <span className="jv-build-text notranslate" translate="no" lang="pt-BR"><span className="jv-screen-reader">{text}</span><span aria-hidden="true">{Array.from(text).map((character, index) => <span key={index} className="jv-build-character" style={{ visibility: elapsed >= delay + index * speed ? 'visible' : 'hidden' }}>{character}</span>)}</span></span>
}
