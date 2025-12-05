import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Users from "./pages/Users";
import Schedule from "./pages/Schedule";
import Logs from "./pages/Logs";
import Reports from "./pages/Reports";
import OCR from "./pages/OCR";
import Settings from "./pages/Settings";
import SCADA from "./pages/SCADA";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Organizations from "./pages/Organizations.tsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  startWebSocket,
  stopWebSocket,
  subscribe,
} from "./utils/webSocketService2.ts";
import { Provider } from "react-redux";
import { RootState, store } from "./store.ts";
import FlostatDashboard from "./pages/FlostatDashboard.tsx";
import PrivateRoute from "./components/auth/ProtectedRoute.tsx";
import CompleteProfile from "./pages/CompleteProfile.tsx";
import { useIsMobile } from "./hooks/use-mobile";
import { useSelector } from "react-redux";
import { getFcmToken, onMessageListener } from "./firebase.ts";

const queryClient = new QueryClient();

function AppShell() {
  const location = useLocation();
  const { isAuthenticated, currentOrganization } = useAuth();
  const isMobile = useIsMobile();
  const [components, setComponents] = useState<string>("dashboard");
  // console.log("Component in app: ", components)
  const { topics} = useSelector((state: RootState)=> state.org);
  // console.log("Topics : ",topics)
  
  useEffect(() => {
    // Step 1: Request permission and get user token
    getFcmToken().then(token => {
      console.log("📌 FCM Token:", token);
    });

    // Step 2: Foreground notification handler
    onMessageListener().then(payload => {
      console.log("📩 Foreground message:", payload);

      if (payload?.notification) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || "/logo192.png"
          });
        });
      }
    });
  }, []);
  const shelllessRoutes = [
    "/",
    "/signin",
    "/signup",
    "/organizations",
    "/complete-profile"
  ] as const;
  const isShellless = shelllessRoutes.some((p) => p === location.pathname);
  useEffect(() => {
    startWebSocket();
    subscribe("pump/status");
    return () => {
      stopWebSocket();
    };
  }, []);
  console.log("IS auth: ", isAuthenticated)
  // Redirect authenticated users from root path to dashboard, but allow access to signin/signup
  if (isAuthenticated && location.pathname === "/") {
    return <Navigate to="/organizations" replace />;
  }

  // Redirect unauthenticated users from protected pages to signup
  // if (!isAuthenticated && !shelllessRoutes.includes(location.pathname as any)) {
  //   return <Navigate to="/" replace />;
  // }



  if (isShellless) {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/organizations" element={
              <PrivateRoute>
                <Organizations />
              </PrivateRoute>
            } />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar components={components} setComponents={setComponents} />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <div className="flex items-center gap-3">
              {isMobile && <SidebarTrigger />}
              <span className="text-base font-semibold text-foreground">
                {currentOrganization?.name ?? "Flostat"}
              </span>
            </div>
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="org/:org_id">

                <Route index element={
                  <PrivateRoute>
                    <FlostatDashboard components={components} />
                  </PrivateRoute>

                } />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Provider store={store}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </Provider>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
