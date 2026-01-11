import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Layout } from "./components/Layout";

import Index from "./pages/Index";
import { Inventory } from "./pages/Inventory";
import { Settings } from "./pages/Settings";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;