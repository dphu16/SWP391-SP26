import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeDetail from "./components/EmployeeDetail";
import EmployeeOnboarding from "./components/EmployeeOnboarding";
import EmployeeOffboarding from "./components/EmployeeOffboarding";
import CandidateProfileCompletion from "./components/CandidateProfileCompletion";
import CreateChangeRequest from "./components/CreateChangeRequest";
import FilterBar from "./components/FilterBar";
import LoginPage from "./components/auth/LoginPage";
import { ToastProvider } from "./components/ui/Toast";
import { isAuthenticated } from "./services/authService";

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) =>
  isAuthenticated() ? element : <Navigate to="/login" replace />;

const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) =>
  isAuthenticated() ? <Navigate to="/dashboard" replace /> : element;

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
        <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />

        <Route path="/*" element={<PrivateRoute element={<AppShell />} />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;
