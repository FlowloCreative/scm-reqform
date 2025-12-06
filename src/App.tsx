import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const Index = lazy(() => import("./pages/Index"));
const Request = lazy(() => import("./pages/Request"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReview = lazy(() => import("./pages/AdminReview"));
const NotFound = lazy(() => import("./pages/NotFound"));
const queryClient = new QueryClient();
const LoadingFallback = () => <div className="min-h-screen flex items-center justify-center bg-slate-800">
    <p className="text-white text-lg">Loading...</p>
  </div>;
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} className="bg-gray-900" />
            <Route path="/request" element={<Request />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/review/:id" element={<AdminReview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;