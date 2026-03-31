import { Link } from "react-router-dom";

const BuiltWithAktivee = () => (
  <Link
    to="/start"
    className="fixed bottom-4 right-4 z-50 animate-gentle-bounce rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
  >
    Built with Aktivee
  </Link>
);

export default BuiltWithAktivee;
