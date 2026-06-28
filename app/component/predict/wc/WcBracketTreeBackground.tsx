/** トーナメント表 — ディープスペース背景（星空・星雲） */
export default function WcBracketTreeBackground() {
  return (
    <div className="wc-bracket-tree-bg" aria-hidden>
      <div className="wc-bracket-tree-bg__base" />
      <div className="wc-bracket-tree-bg__nebula wc-bracket-tree-bg__nebula--violet" />
      <div className="wc-bracket-tree-bg__nebula wc-bracket-tree-bg__nebula--teal" />
      <div className="wc-bracket-tree-bg__nebula wc-bracket-tree-bg__nebula--core" />
      <div className="wc-bracket-tree-bg__stars wc-bracket-tree-bg__stars--far" />
      <div className="wc-bracket-tree-bg__stars wc-bracket-tree-bg__stars--mid" />
      <div className="wc-bracket-tree-bg__stars wc-bracket-tree-bg__stars--near" />
      <div className="wc-bracket-tree-bg__vignette" />

      <div className="wc-bracket-tree-bg__header">
        <span className="wc-bracket-tree-bg__brand">UNITERZ</span>
        <span className="wc-bracket-tree-bg__heading">ROUND OF 32</span>
      </div>
    </div>
  );
}
