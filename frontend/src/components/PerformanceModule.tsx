import { useState } from "react";
import ManagerPerformance from "./ManagerPerformance";
import HRPerformance from "./HRPerformance";

const PerformanceModule = () => {
    const [activeTab, setActiveTab] = useState("hr");

    return activeTab === "manager"
        ? <ManagerPerformance activeTab={activeTab} setActiveTab={setActiveTab} />
        : <HRPerformance activeTab={activeTab} setActiveTab={setActiveTab} />;
};

export default PerformanceModule;
