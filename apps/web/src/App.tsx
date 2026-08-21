import { AppProviders } from "@/app/providers/AppProviders";
import { AppRouter } from "@/app/router/AppRouter";

export function App() {
  return (
    <AppProviders>
      <a className="skip-link" href="#main">
        Skip to content · Tới nội dung
      </a>
      <AppRouter />
    </AppProviders>
  );
}
