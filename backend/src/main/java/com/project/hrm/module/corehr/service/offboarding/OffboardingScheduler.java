package com.project.hrm.module.corehr.service.offboarding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OffboardingScheduler {

    private static final Logger log = LoggerFactory.getLogger(OffboardingScheduler.class);

    private final OffboardingCommandService commandService;

    public OffboardingScheduler(OffboardingCommandService commandService) {
        this.commandService = commandService;
    }

    /**
     * BRD 3.4: Chạy hàng ngày lúc 00:05
     * - Tìm các offboarding request đã HR_CONFIRMED mà officialLastDay <= today
     * - Chuyển employee sang TERMINATED/RESIGNED, vô hiệu hóa tài khoản
     * - Chuyển offboarding status sang COMPLETED
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void processOffboardingOnLastDay() {
        log.info("Running scheduled offboarding deactivation check...");
        commandService.processOffboardingOnLastDay();
        log.info("Scheduled offboarding deactivation check completed.");
    }
}
