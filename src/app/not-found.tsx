import Link from "next/link";
export default function Missing() {
  return (
    <div className="form-page">
      <span className="eyebrow">AN UNEXPLORED PATH</span>
      <h1>No idea lives here yet.</h1>
      <p>The link may have changed, or this tree may be private.</p>
      <Link className="button primary" href="/explore">
        Return to the network
      </Link>
    </div>
  );
}
