import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/shared/sidebar";
import Header from "./components/shared/Header";
import HRDashboard from "./components/coreHR/HRDashboard";
import EmployeeDetail from "./components/coreHR/EmployeeDetail";
import EmployeeOnboarding from "./components/coreHR/EmployeeOnboarding";
import HiredApplications from "./components/coreHR/HiredApplications";
import OffboardingRequests from "./components/coreHR/OffboardingRequests";
import CandidateProfileCompletion from "./components/coreHR/CandidateProfileCompletion";
import EmployeeDirectory from "./components/coreHR/EmployeeDirectory";

// --- Nhóm route Attendance của bạn ---
import ViewSchedule from "./components/attendance/ViewSchedule";
import CreateSchedule from "./components/attendance/CreateSchedule";
import CheckInOut from "./components/attendance/CheckInOut";
import Applications from "./components/attendance/Applications";
import ReviewRequests from "./components/attendance/ReviewRequests";
import AttendanceSummary from "./components/attendance/AttendanceSummary";
import PerformanceModule from "./components/PerformanceModule";
import PayrollModule from "./components/payroll/PayrollModule";
import JobListPage from "./components/recruitment/JobListPage";
import JobDetailPage from "./components/recruitment/JobDetailPage";
import JobFormPage from "./components/recruitment/JobFormPage";
import JobRequestListPage from "./components/recruitment/JobRequestListPage";
import JobRequestDetailPage from "./components/recruitment/JobRequestDetailPage";
import JobRequestFormPage from "./components/recruitment/JobRequestFormPage";
import CVListPage from "./components/recruitment/CVListPage";
import CVReviewPage from "./components/recruitment/CVReviewPage";
import SchedulePage from "./components/recruitment/SchedulePage";
import PublicJobList from "./components/recruitment/PublicJobList";
import PublicJobDetail from "./components/recruitment/PublicJobDetail";
// --- Auth ---
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import OAuth2Callback from "./components/auth/OAuth2Callback";
// --- Activation (public) ---
import ActivationPage from "./components/activation/ActivationPage";

// --- Import từ nhánh develop của nhóm ---
import { ToastProvider } from "./components/ui/Toast";

const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen bg-background-light text-text-primary-light font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto bg-background-light ">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<HRDashboard />} />

              {/* Core HR Routes */}
              <Route path="/employees" element={<EmployeeDirectory />} />

              <Route
                path="/onboarding"
                element={<Navigate to="/onboarding/hired" replace />}
              />
              <Route path="/onboarding/hired" element={<HiredApplications />} />
              <Route
                path="/onboarding/progress"
                element={<EmployeeOnboarding />}
              />
              <Route
                path="/onboarding/:applicationId/profile"
                element={<CandidateProfileCompletion />}
              />
              <Route
                path="/offboarding"
                element={<Navigate to="/offboarding/requests" replace />}
              />
              <Route
                path="/offboarding/requests"
                element={<OffboardingRequests />}
              />

              {/* --- Các Route Attendance của bạn --- */}
              <Route
                path="/attendance/view-schedule"
                element={<ViewSchedule />}
              />
              <Route
                path="/attendance/create-schedule"
                element={<CreateSchedule />}
              />
              <Route path="/attendance/check-in-out" element={<CheckInOut />} />
              <Route
                path="/attendance/applications"
                element={<Applications />}
              />
              <Route path="/attendance/review" element={<ReviewRequests />} />
              <Route
                path="/attendance/summary"
                element={<AttendanceSummary />}
              />

              {/* Payroll — single wildcard route, PayrollModule handles sub-routes internally */}
              <Route path="/payroll/*" element={<PayrollModule />} />

              {/* Performance */}
              <Route path="/performance" element={<PerformanceModule />} />

              <Route path="/employee/:id" element={<EmployeeDetail />} />
              <Route path="/profile" element={<EmployeeDetail />} />
              <Route path="/recruitment/jobs" element={<JobListPage />} />
              <Route path="/recruitment/jobs/new" element={<JobFormPage />} />
              <Route path="/recruitment/jobs/:id" element={<JobDetailPage />} />
              <Route
                path="/recruitment/jobs/edit/:id"
                element={<JobFormPage />}
              />
              <Route path="/recruitment/cvs" element={<CVListPage />} />
              <Route path="/recruitment/cvs/:id" element={<CVReviewPage />} />
              <Route path="/recruitment/schedules" element={<SchedulePage />} />

              <Route
                path="/recruitment/job-requests"
                element={<JobRequestListPage />}
              />
              <Route
                path="/recruitment/job-requests/new"
                element={<JobRequestFormPage />}
              />
              <Route
                path="/recruitment/job-requests/:id"
                element={<JobRequestDetailPage />}
              />
              <Route
                path="/recruitment/job-requests/:id/edit"
                element={<JobRequestFormPage />}
              />
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
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        <Route path="/activation" element={<ActivationPage />} />

        {/* Public Recruitment Routes */}
        <Route path="/careers" element={<PublicJobList />} />
        <Route path="/careers/:id" element={<PublicJobDetail />} />

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
