import React from "react";
import ProfileCard from "./detail/ProfileCard";
import GeneralTab from "./detail/GeneralTab";
import JobTab from "./detail/JobTab";
import EmployeeActivityLog from "./detail/EmployeeActivityLog";
import DetailSkeleton from "./detail/DetailSkeleton";
import DetailError from "./detail/DetailError";
import DetailTabs from "./detail/DetailTabs";
import { useEmployeeDetail } from "./hooks/useEmployeeDetail";

const EmployeeDetail: React.FC = () => {
  const {
    id,
    detail,
    setDetail,
    loading,
    error,
    activeTab,
    setActiveTab,
    dependents,
    setDependents,
  } = useEmployeeDetail();

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return <DetailError error={error} />;
  }

  const dep = dependents[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          {detail && <ProfileCard detail={detail} />}
        </div>

        {/* Right Column: Tabs + Content */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          <DetailTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === "General" && detail && id && (
            <GeneralTab
              detail={detail}
              dep={dep}
              setDep={(newDep) => setDependents([newDep])}
              employeeId={id}
              onDetailUpdated={setDetail}
            />
          )}

          {activeTab === "Job" && detail && <JobTab detail={detail} />}
          
          {activeTab === "Activity Log" && id && <EmployeeActivityLog employeeId={id} />}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
