export default function Loading() {
  return (
    <div className="form-page" role="status" aria-label="Loading workspace">
      <span className="eyebrow">CONNECTING THE BRANCHES</span>
      <div
        className="skeleton"
        style={{ height: 36, width: "65%", marginTop: 25 }}
      />
      <div className="skeleton short" />
      <div className="skeleton" style={{ height: 200, marginTop: 35 }} />
    </div>
  );
}
