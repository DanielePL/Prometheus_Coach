import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
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

function App() {
  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/book/:slug" element={<BookingPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/copy-inbox" element={<ProtectedRoute><CopyInbox /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/uploads" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Uploads /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Clients /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/clients/:clientId" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><ClientDetail /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/routines" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><Routines /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/routines/create" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><CreateEditRoutine /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/routines/:routineId" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><RoutineDetail /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/routines/:routineId/edit" element={<ProtectedRoute><RoleBasedRoute allowedRoles={['coach', 'admin']} message="This feature is for coaches only"><CreateEditRoutine /></RoleBasedRoute></ProtectedRoute>} />
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
