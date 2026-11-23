import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";

export default function NotFound() {
  return (
    <main className="page page--center">
      <EmptyState icon="search" title="This page isn't on the menu" text="The link may be old or mistyped." action={<Link to="/" className="btn btn--primary">Go to home</Link>} />
    </main>
  );
}
