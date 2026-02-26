const CheckInOut: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState<"pending" | "checked_in" | "checked_out">("pending");
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    };

    };


    return (
        <div className="flex flex-col pb-10 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Time & Attendance</h1>
                <p className="text-[#64748b] text-[15px] mt-1">Ghi nhận giờ vào, giờ ra của bạn trong ngày.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── MAIN CLOCK PANEL ── */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#f0fdf4] rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#f0f9ff] rounded-full blur-3xl opacity-60"></div>

                            <div className="relative z-10 text-center mb-10">
                                <p className="text-[#64748b] font-medium text-lg mb-2 uppercase tracking-wider">{formatDate(currentTime)}</p>
                                <h2 className="text-[72px] font-bold text-[#0f172a] leading-none tracking-tight font-mono">
                                    {formatTime(currentTime)}
                                </h2>
                            </div>

                            <div className="relative z-10 w-full max-w-md space-y-4">
                                {status === "pending" && (
                                        <button
                                            onClick={handleCheckIn}
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                            <div className="flex items-center justify-center gap-3">
                                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                    </svg>
                                            </div>
                                        </button>
                                )}

                                {status === "checked_in" && (
                                        <button
                                            onClick={handleCheckOut}
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                            <div className="flex items-center justify-center gap-3">
                                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                            </div>
                                        </button>
                                )}

                                {status === "checked_out" && (
                                    <div className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] py-5 rounded-2xl font-bold text-xl text-center flex items-center justify-center gap-3 cursor-not-allowed">
                                        <svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        HOÀN THÀNH CA LÀM
                                    </div>
                                )}
                            </div>
                </div>

                {/* ── STATUS PANEL ── */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-5">Ca Làm Việc Hôm Nay</h3>
                            <div className="p-4 rounded-xl bg-[#ccfbf1] border border-[#99f6e4]">
                            </div>
                            </div>
                    </div>

                    <div className="border-t border-[#f1f5f9]"></div>

                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-4">Trạng Thái</h3>
                        <div className="space-y-4">
                            {/* Check In Stat */}
                            <div className="flex items-center gap-4">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                    <p className="text-sm text-[#64748b] font-medium">Giờ vào</p>
                                        <p className={`text-lg font-bold ${checkInTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>
                                        </p>
                                </div>
                            </div>

                            {/* Check Out Stat */}
                            <div className="flex items-center gap-4">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                    <p className="text-sm text-[#64748b] font-medium">Giờ ra</p>
                                        <p className={`text-lg font-bold ${checkOutTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>
                                        </p>
                                    </div>
                            </div>

                            {/* Total Time Stat */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#e0f2fe] text-[#0369a1]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[#64748b] font-medium">Tổng giờ làm</p>
                                    <p className="text-lg font-bold text-[#0f172a]">
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tailwind Keyframes cho animation shimmer */}
            <style>
                {`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        `}
            </style>
        </div>
    );
};

export default CheckInOut;
