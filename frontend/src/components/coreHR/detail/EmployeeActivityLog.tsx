import React, { useEffect, useState } from "react";
import apiClient from "../../../services/apiClient";

interface ActivityLog {
  id: number;
  timestamp: string;
  actor: string;
  actionType: string;
  description: string;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
}

interface EmployeeActivityLogProps {
  employeeId: string;
}

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(d);
  } catch (e) {
    return dateString;
  }
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EmployeeActivityLog: React.FC<EmployeeActivityLogProps> = ({ employeeId }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<ActivityLog[]>(
          `/api/employees/${employeeId}/activity-logs`
        );
        setLogs(res.data);
      } catch (err: unknown) {
        if (err instanceof Error && "response" in err) {
          const axErr = err as { response?: { status: number; statusText: string } };
          setError(`Error ${axErr.response?.status}: ${axErr.response?.statusText}`);
        } else {
          setError("An unknown error occurred while loading activity history.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchLogs();
    }
  }, [employeeId]);

  const getActionConfig = (actionType: string) => {
    switch (actionType?.toUpperCase()) {
      case "CREATE":
        return {
          bgColor: "bg-green-100",
          icon: <PlusIcon className="w-5 h-5 text-green-600" />,
          badge: "bg-green-100 text-green-800",
        };
      case "UPDATE":
        return {
          bgColor: "bg-blue-100",
          icon: <EditIcon className="w-5 h-5 text-blue-600" />,
          badge: "bg-blue-100 text-blue-800",
        };
      case "DELETE":
        return {
          bgColor: "bg-red-100",
          icon: <TrashIcon className="w-5 h-5 text-red-600" />,
          badge: "bg-red-100 text-red-800",
        };
      case "REQUEST":
        return {
          bgColor: "bg-purple-100",
          icon: <FileTextIcon className="w-5 h-5 text-purple-600" />,
          badge: "bg-purple-100 text-purple-800",
        };
      case "APPROVE":
        return {
          bgColor: "bg-green-100",
          icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
          badge: "bg-green-100 text-green-800",
        };
      case "REJECT":
        return {
          bgColor: "bg-red-100",
          icon: <XCircleIcon className="w-5 h-5 text-red-600" />,
          badge: "bg-red-100 text-red-800",
        };
      default:
        return {
          bgColor: "bg-gray-100",
          icon: <ClockIcon className="w-5 h-5 text-gray-600" />,
          badge: "bg-gray-100 text-gray-800",
        };
    }
  };

  if (loading) {
    return (
      <div className="p-8 border rounded-2xl bg-white shadow-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-2xl bg-white shadow-sm">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg flex items-center gap-3">
          <XCircleIcon className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 border rounded-2xl bg-white shadow-sm text-center">
        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <ClockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No activity history yet</h3>
        <p className="text-gray-500">No activities recorded for this employee yet.</p>
      </div>
    );
  }

  return (
    <div className="p-8 border border-gray-100 rounded-2xl bg-white shadow-sm animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-primary" />
        Activity History
      </h2>
      
      <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pl-8">
        {logs.map((log, index) => {
          const config = getActionConfig(log.actionType);
          
          return (
            <div key={log.id || index} className="relative group">
              <span className={`absolute -left-[41px] flex items-center justify-center w-[34px] h-[34px] rounded-full ring-4 ring-white ${config.bgColor}`}>
                {config.icon}
              </span>
              
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${config.badge}`}>
                      {log.actionType || "UNKNOWN"}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      By <span className="text-gray-900 font-semibold">{log.actor}</span>
                    </span>
                  </div>
                  <time className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    {log.timestamp 
                      ? formatDate(log.timestamp)
                      : "Unknown time"}
                  </time>
                </div>
                
                <p className="text-gray-800 font-medium text-sm mt-3 mb-2">
                  {log.description}
                </p>

                {log.fieldChanged && (log.oldValue || log.newValue) && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 border-dashed text-sm">
                    <div className="text-xs text-gray-500 mb-1.5 uppercase font-semibold tracking-wider">
                      Field Changed: <span className="text-gray-700">{log.fieldChanged}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {log.oldValue && (
                        <div className="flex-1 bg-white p-2 rounded border border-gray-200 text-gray-600 line-through">
                          {log.oldValue}
                        </div>
                      )}
                      {log.oldValue && log.newValue && (
                        <div className="text-gray-400 mx-auto">→</div>
                      )}
                      {log.newValue && (
                        <div className="flex-1 bg-white p-2 text-green-700 rounded border border-green-200 font-medium shadow-sm">
                          {log.newValue}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeActivityLog;
