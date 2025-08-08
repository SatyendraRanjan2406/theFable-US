import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { APP_CONFIG } from "./config/app";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ContactFloatingButton from "./components/ContactFloatingButton";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Dashboard from "./pages/Dashboard";
import StoriesHistory from "./pages/StoriesHistory";
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";
import PaymentRefundPolicy from "./pages/PaymentRefundPolicy";
import SidePanel from "./components/SidePanel";
import { useState, useEffect } from "react";
import StoryPage from './pages/StoryPage';
import StripeCheckout from './pages/StripeCheckout';
import { ContactProvider } from "./context/ContactContext";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/LoginModal";
import PaymentSuccess from "./pages/PaymentSuccess";
import { trackPageView } from "@/utils/gtm";

const queryClient = new QueryClient();

export const App = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, login, logout } = useAuth();
  const location = useLocation();

  // Auto-close SidePanel on route change
  useEffect(() => {
    setIsSidePanelOpen(false);
  }, [location]);

  // Track page views for SPA navigation
  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    trackPageView(location.pathname, pageTitle);
  }, [location.pathname]);

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Home - StoryMaker';
      case '/dashboard':
        return 'Dashboard - StoryMaker';
      case '/stories-history':
        return 'Stories History - StoryMaker';
      case '/payments':
        return 'Payments - StoryMaker';
      case '/payment-success':
        return 'Payment Success - StoryMaker';
      case '/payment-refund-policy':
        return 'Payment Refund Policy - StoryMaker';
      case '/privacy':
        return 'Privacy Policy - StoryMaker';
      case '/terms':
        return 'Terms & Conditions - StoryMaker';
      case '/oauth/callback':
        return 'OAuth Callback - StoryMaker';
      default:
        if (pathname.startsWith('/story/')) {
          return 'Story Details - StoryMaker';
        }
        return 'StoryMaker';
    }
  };

  const handleLoginClick = () => setIsLoginModalOpen(true);
  const handleLoginSuccess = () => {
    login();
    setIsLoginModalOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ContactProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidePanel 
            isOpen={isSidePanelOpen} 
            onToggle={() => setIsSidePanelOpen(!isSidePanelOpen)} 
            onLoginClick={handleLoginClick}
          />
          {/* Global Header */}
          <header className="sticky top-0 z-50 bg-white shadow flex justify-between items-center px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className="p-2 text-[#8D4BE5] hover:text-[#6B21A8] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="text-xl md:text-2xl font-bold text-[#8D4BE5]">{APP_CONFIG.title}</Link>
            </div>
            <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
              <Link to="/privacy" className="flex items-center gap-1 md:gap-2 text-[#8D4BE5] hover:text-[#6B21A8] transition-colors text-xs md:text-sm lg:text-base font-medium">
                <svg className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="hidden lg:inline">Privacy Policy</span>
                <span className="hidden sm:inline lg:hidden">Privacy</span>
                <span className="sm:hidden">P</span>
              </Link>
              <Link to="/terms" className="flex items-center gap-1 md:gap-2 text-[#8D4BE5] hover:text-[#6B21A8] transition-colors text-xs md:text-sm lg:text-base font-medium">
                <svg className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="hidden lg:inline">Terms & Conditions</span>
                <span className="hidden sm:inline lg:hidden">Terms</span>
                <span className="sm:hidden">T</span>
              </Link>
              <button
                onClick={isAuthenticated ? logout : handleLoginClick}
                className="text-xs md:text-sm lg:text-base font-medium text-[#8D4BE5] hover:text-[#6B21A8] transition-colors"
              >
                {isAuthenticated ? 'Logout' : 'Login'}
              </button>
            </div>
          </header>
          {/* End Global Header */}
          <LoginModal
            isOpen={isLoginModalOpen}
            onOpenChange={setIsLoginModalOpen}
            onLoginSuccess={handleLoginSuccess}
          />
          <Routes>
            <Route path="/" element={<Index onMenuToggle={() => setIsSidePanelOpen(!isSidePanelOpen)} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stories-history" element={<StoriesHistory />} />
            {/* <Route path="/settings" element={<Settings />} /> */}
            <Route path="/payments" element={<Payments />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-refund-policy" element={<PaymentRefundPolicy />} />
            <Route path="/story/:id" element={<StoryPage />} />
            <Route path="/stripe-checkout" element={<StripeCheckout />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ContactFloatingButton />
        </TooltipProvider>
      </ContactProvider>
    </QueryClientProvider>
  );
};
