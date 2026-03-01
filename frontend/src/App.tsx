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

// --- Nhóm route Attendance của bạn ---
import ViewSchedule from "./components/attendance/ViewSchedule";
import CreateSchedule from "./components/attendance/CreateSchedule";
import CheckInOut from "./components/attendance/CheckInOut";
import Applications from "./components/attendance/Applications";
import ReviewRequests from "./components/attendance/ReviewRequests";
import AttendanceSummary from "./components/attendance/AttendanceSummary";
import PerformanceModule from "./components/PerformanceModule";

// --- Auth ---
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
                            <Route
                                path="/employees"
                                element={
                                    <>
                                        <div className="flex items-center justify-between">
                                            <h1 className="text-2xl font-bold tracking-tight">
                                                Employee Directory
                                            </h1>
                                        </div>
                                        <FilterBar />
                                        <EmployeeTable />
                                    </>
                                }
                            />

                            <Route path="/onboarding" element={<EmployeeOnboarding />} />
                            <Route
                                path="/onboarding/:applicationId/profile"
                                element={<CandidateProfileCompletion />}
                            />
                            <Route path="/offboarding" element={<EmployeeOffboarding />} />

                            {/* Route Change Request đã được sửa lỗi cú pháp */}
                            <Route path="/change-request" element={<CreateChangeRequest />} />

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
                            <Route path="/attendance/summary" element={<AttendanceSummary />} />

                            {/* Performance */}
                            <Route path="/performance" element={<PerformanceModule />} />

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