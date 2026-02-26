import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../shared/components/Sidebar";
import Header from "../shared/components/Header";
import EmployeeTable from "../features/employees/pages/EmployeeTable";
import EmployeeDetail from "../features/employees/pages/EmployeeDetail";
import EmployeeOnboarding from "../features/employees/pages/EmployeeOnboarding";
import EmployeeOffboarding from "../features/employees/pages/EmployeeOffboarding";
import CandidateProfileCompletion from "../features/employees/pages/CandidateProfileCompletion";
import CreateChangeRequest from "../features/requests/pages/CreateChangeRequest";
import FilterBar from "../features/employees/components/FilterBar";
import HRDashboard from "../features/dashboard/pages/HRDashboard";

// Recruitment Module
import JobListPage from "../features/recruitment/pages/JobListPage";
import JobFormPage from "../features/recruitment/pages/JobFormPage";
import JobDetailPage from "../features/recruitment/pages/JobDetailPage";
import JobRequestListPage from "../features/recruitment/pages/JobRequestListPage";
import JobRequestFormPage from "../features/recruitment/pages/JobRequestFormPage";
import JobRequestDetailPage from "../features/recruitment/pages/JobRequestDetailPage";

import { ToastProvider } from "../shared/components/ui/Toast";

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

              <Route
                path="/employees"
                element={
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                          Employee Directory
                        </h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Manage and view all employees in your organization
                        </p>
                      </div>
                    </div>
                    <FilterBar />
                    <EmployeeTable />
                  </>
                }
              />

              <Route
                path="/onboarding"
                element={
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                          Onboarding
                        </h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Track new hire onboarding progress
                        </p>
                      </div>
                    </div>
                    <FilterBar />
                    <EmployeeOnboarding />
                  </>
                }
              />

              <Route
                path="/onboarding/:applicationId/profile"
                element={<CandidateProfileCompletion />}
              />

              <Route
                path="/offboarding"
                element={
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                          Offboarding
                        </h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Manage exits, resignations, and handover workflows
                        </p>
                      </div>
                    </div>
                    <EmployeeOffboarding />
                  </>
                }
              />

              <Route
                path="/requests/new"
                element={
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                          Create Change Personal Info Request
                        </h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Submit a change request for your personal information
                        </p>
                      </div>
                    </div>
                    <CreateChangeRequest />
                  </>
                }
              />

              <Route path="/employee/:id" element={<EmployeeDetail />} />
              <Route path="/profile" element={<EmployeeDetail />} />

              {/* Recruitment Module Routes */}
              <Route path="/recruitment/job-requests" element={<JobRequestListPage />} />
              <Route path="/recruitment/job-requests/new" element={<JobRequestFormPage />} />
              <Route path="/recruitment/job-requests/:id" element={<JobRequestDetailPage />} />
              <Route path="/recruitment/job-requests/:id/edit" element={<JobRequestFormPage />} />

              <Route path="/recruitment/jobs" element={<JobListPage />} />
              <Route path="/recruitment/jobs/new" element={<JobFormPage />} />
              <Route path="/recruitment/jobs/edit/:id" element={<JobFormPage />} />
              <Route path="/recruitment/jobs/:id" element={<JobDetailPage />} />
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
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

