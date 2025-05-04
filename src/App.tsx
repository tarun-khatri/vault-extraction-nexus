
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

import { WalletProvider } from "./context/WalletContext";
import { ChainProvider } from "./context/ChainContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CorePool from "./pages/CorePool";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChainProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="core-pool" element={<CorePool />} />
              <Route path="admin" element={<AdminPanel />} />
              {/* More routes will be added as we develop additional features */}
              {/* Placeholder routes */}
              <Route path="isolated-pools" element={<CorePool />} /> {/* Placeholder */}
              <Route path="vaults" element={<Dashboard />} /> {/* Placeholder */}
              <Route path="governance" element={<Dashboard />} /> {/* Placeholder */}
              <Route path="bridge" element={<Dashboard />} /> {/* Placeholder */}
              <Route path="nft" element={<Dashboard />} /> {/* Placeholder */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WalletProvider>
      </ChainProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
