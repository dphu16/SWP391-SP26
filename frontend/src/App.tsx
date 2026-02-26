import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HRDashboard from "./components/HRDashboard";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeDetail from "./components/EmployeeDetail";
import EmployeeOnboarding from "./components/EmployeeOnboarding";
import EmployeeOffboarding from "./components/EmployeeOffboarding";
import CandidateProfileCompletion from "./components/CandidateProfileCompletion";
import CreateChangeRequest from "./components/CreateChangeRequest";
import FilterBar from "./components/FilterBar";
import PerformanceModule from "./components/PerformanceModule";

// --- Nhóm route Attendance ---
import ViewSchedule from "./components/attendance/ViewSchedule";
import CreateSchedule from "./components/attendance/CreateSchedule";
import CheckInOut from "./components/attendance/CheckInOut";
import Applications from "./components/attendance/Applications";
import ReviewRequests from "./components/attendance/ReviewRequests";

// --- Auth ---
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// --- UI ---
import { ToastProvider } from "./components/ui/Toast";

const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<HRDashboard />} />

              {/* Core HR Routes */}
              <Route
                path="/employees"
                element={
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Manage and view all employees
                        </p>
                      </div>
                    </div>
                    <FilterBar />
                    <EmployeeTable />
                  </>
                }
              />

              <Route path="/onboarding" element={<EmployeeOnboarding />} />
              <Route path="/onboarding/:applicationId/profile" element={<CandidateProfileCompletion />} />
              <Route path="/offboarding" element={<EmployeeOffboarding />} />

              {/* Kết hợp cả 2 cách đặt tên route cho chắc chắn hoặc chọn 1 */}
              <Route path="/change-request" element={<CreateChangeRequest />} />
              <Route path="/requests/new" element={<CreateChangeRequest />} />

              {/* --- Attendance Routes --- */}
              <Route path="/attendance/view-schedule" element={<ViewSchedule />} />
              <Route path="/attendance/create-schedule" element={<CreateSchedule />} />
              <Route path="/attendance/check-in-out" element={<CheckInOut />} />
              <Route path="/attendance/applications" element={<Applications />} />
              <Route path="/attendance/review" element={<ReviewRequests />} />

              {/* --- Performance & Profile --- */}
              <Route path="/employee/:id" element={<EmployeeDetail />} />
              <Route path="/profile" element={<EmployeeDetail />} />
              <Route path="/performance" element={<PerformanceModule />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  );
};

export default App;