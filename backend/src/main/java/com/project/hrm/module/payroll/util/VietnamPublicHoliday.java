package com.project.hrm.module.payroll.util;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Danh sách ngày lễ quốc gia Việt Nam theo Bộ Luật Lao Động.
 * Nhân viên vắng mặt đúng ngày lễ sẽ KHÔNG bị trừ lương.
 *
 * Tổng: 11 ngày lễ + ngày bù (tùy năm).
 * Các ngày Tết & Giỗ Tổ Hùng Vương được hardcode theo dương lịch từng năm.
 */
public final class VietnamPublicHoliday {

    private VietnamPublicHoliday() {}

    /**
     * Trả về Set các ngày lễ dương lịch cho năm được chỉ định.
     * Nếu năm chưa có trong bảng hardcode, chỉ trả về các ngày cố định.
     */
    public static Set<LocalDate> getHolidays(int year) {
        Set<LocalDate> holidays = new HashSet<>();

        // ── 1. Tết Dương lịch ──────────────────────────────────────────
        holidays.add(LocalDate.of(year, 1, 1));

        // ── 2. Tết Nguyên Đán (5 ngày — hardcode theo năm) ─────────────
        addTet(holidays, year);

        // ── 3. Giỗ Tổ Hùng Vương (hardcode theo năm) ───────────────────
        addHungKing(holidays, year);

        // ── 4. Ngày Giải phóng miền Nam ────────────────────────────────
        holidays.add(LocalDate.of(year, 4, 30));

        // ── 5. Quốc tế Lao động ────────────────────────────────────────
        holidays.add(LocalDate.of(year, 5, 1));

        // ── 6. Quốc khánh ──────────────────────────────────────────────
        holidays.add(LocalDate.of(year, 9, 2));
        // Ngày bù Quốc khánh (thường là 03/09 nếu 02/09 rơi vào cuối tuần)
        LocalDate nationalDay = LocalDate.of(year, 9, 2);
        if (nationalDay.getDayOfWeek().getValue() >= 6) { // Sat or Sun
            holidays.add(LocalDate.of(year, 9, 3));
        }

        return holidays;
    }

    // ────────────────────────────────────────────────────────────────────
    // Tết Nguyên Đán — hardcode dương lịch theo từng năm
    // (29 tháng Chạp ÂL → mùng 3 tháng Giêng ÂL, tổng 5 ngày)
    // ────────────────────────────────────────────────────────────────────
    private static void addTet(Set<LocalDate> holidays, int year) {
        switch (year) {
            case 2024 -> addDays(holidays, LocalDate.of(2024, 2, 8), 5);   // Giáp Thìn
            case 2025 -> addDays(holidays, LocalDate.of(2025, 1, 27), 5);  // Ất Tỵ
            case 2026 -> addDays(holidays, LocalDate.of(2026, 2, 16), 5);  // Bính Ngọ
            case 2027 -> addDays(holidays, LocalDate.of(2027, 2, 5), 5);   // Đinh Mùi
            case 2028 -> addDays(holidays, LocalDate.of(2028, 1, 25), 5);  // Mậu Thân
            case 2029 -> addDays(holidays, LocalDate.of(2029, 2, 12), 5);  // Kỷ Dậu
            case 2030 -> addDays(holidays, LocalDate.of(2030, 2, 2), 5);   // Canh Tuất
            default   -> {} // năm chưa có → bỏ qua, chỉ tính ngày cố định
        }
    }

    // ────────────────────────────────────────────────────────────────────
    // Giỗ Tổ Hùng Vương — 10/3 âm lịch → hardcode dương lịch
    // ────────────────────────────────────────────────────────────────────
    private static void addHungKing(Set<LocalDate> holidays, int year) {
        switch (year) {
            case 2024 -> holidays.add(LocalDate.of(2024, 4, 18));
            case 2025 -> holidays.add(LocalDate.of(2025, 4, 7));
            case 2026 -> holidays.add(LocalDate.of(2026, 4, 26));
            case 2027 -> holidays.add(LocalDate.of(2027, 4, 16));
            case 2028 -> holidays.add(LocalDate.of(2028, 4, 5));
            case 2029 -> holidays.add(LocalDate.of(2029, 4, 23));
            case 2030 -> holidays.add(LocalDate.of(2030, 4, 12));
            default   -> {}
        }
    }

    /** Thêm N ngày liên tiếp bắt đầu từ startDate vào tập holidays */
    private static void addDays(Set<LocalDate> holidays, LocalDate startDate, int count) {
        for (int i = 0; i < count; i++) {
            holidays.add(startDate.plusDays(i));
        }
    }
}
