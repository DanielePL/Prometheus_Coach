import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { SubscriptionRoute } from "./components/SubscriptionRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Explore from "./pages/Explore";
import Saved from "./pages/Saved";
import Calendar from "./pages/Calendar";
import Inbox from "./pages/Inbox";
import CopyInbox from "./pages/CopyInbox";
import Requests from "./pages/Requests";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Uploads from "./pages/Uploads";
import MyWorkouts from "./pages/MyWorkouts";
import MyProgress from "./pages/MyProgress";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import ExerciseDetail from "./pages/ExerciseDetail";
import Settings from "./pages/Settings";
import BookingPage from "./pages/BookingPage";
import Routines from "./pages/Routines";
import CreateEditRoutine from "./pages/CreateEditRoutine";
import RoutineDetail from "./pages/RoutineDetail";
import ClientWorkouts from "./pages/ClientWorkouts";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutComplete from "./pages/WorkoutComplete";
import WorkoutHistoryDetail from "./pages/WorkoutHistoryDetail";
import Trends from "./pages/Trends";
import Assistant from "./pages/Assistant";

function App() {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/book/:slug" element={<BookingPage />} />
            <Route path="/" element={<ProtectedRoute><SubscriptionRoute><Dashboard /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><SubscriptionRoute><Dashboard /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><SubscriptionRoute><Library /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/explore" element={<Navigate to="/library" replace />} />
            <Route path="/saved" element={<ProtectedRoute><SubscriptionRoute><Saved /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><SubscriptionRoute><Calendar /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><SubscriptionRoute><Inbox /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/copy-inbox" element={<ProtectedRoute><SubscriptionRoute><CopyInbox /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><SubscriptionRoute><Requests /></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/uploads" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Uploads /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Clients /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/clients/:clientId" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><ClientDetail /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/trends" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Trends /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="AI Assistant is for coaches only"><Assistant /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/routines" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Routines /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/routines/create" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><CreateEditRoutine /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/routines/:routineId" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><RoutineDetail /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/routines/:routineId/edit" element={<ProtectedRoute><SubscriptionRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><CreateEditRoutine /></RoleBasedRoute></SubscriptionRoute></ProtectedRoute>} />
            <Route path="/workouts" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['client']} message="This page is for clients only"><ClientWorkouts /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/workouts/session/:sessionId" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['client']} message="This page is for clients only"><WorkoutSession /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/workouts/complete/:sessionId" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['client']} message="This page is for clients only"><WorkoutComplete /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/workouts/history/:sessionId" element={<ProtectedRoute><WorkoutHistoryDetail /></ProtectedRoute>} />
            <Route path="/my-workouts" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['client']} message="This page is for clients only"><MyWorkouts /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/my-progress" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['client']} message="This page is for clients only"><MyProgress /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/barbell-back-squat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/exercise/:id" element={<ProtectedRoute><ExerciseDetail /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
