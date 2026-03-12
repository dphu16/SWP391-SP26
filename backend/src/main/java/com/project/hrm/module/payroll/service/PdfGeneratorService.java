package com.project.hrm.module.payroll.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    public byte[] generatePayslipPdf(PayslipResponse payslip) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, out);
            document.open();

            // Font setting (Sử dụng font mặc định, nếu cần font tiếng việt cần embed ttf)
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            // TODO: Ideally use a Unicode font for Vietnamese. We stick to basic for demo.

            // Tiêu đề
            Paragraph title = new Paragraph("PAYSLIP", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Thông tin nhân viên
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);

            infoTable.addCell(createCell("Employee ID:", headFont));
            infoTable.addCell(createCell(payslip.getEmployeeId().toString(), normalFont));
            
            infoTable.addCell(createCell("Employee Name:", headFont));
            infoTable.addCell(createCell(payslip.getEmployeeName(), normalFont));

            infoTable.addCell(createCell("Period:", headFont));
            infoTable.addCell(createCell(payslip.getMonth() + "/" + payslip.getYear(), normalFont));
            
            infoTable.addCell(createCell("Batch ID:", headFont));
            infoTable.addCell(createCell(payslip.getBatchId().toString(), normalFont));

            document.add(infoTable);

            // Bảng tính lương
            PdfPTable salaryTable = new PdfPTable(2);
            salaryTable.setWidthPercentage(100);
            salaryTable.setSpacingAfter(20);

            salaryTable.addCell(createCell("Description", headFont));
            salaryTable.addCell(createCell("Amount (VND)", headFont));

            salaryTable.addCell(createCell("Base Salary", normalFont));
            salaryTable.addCell(createCell(formatCurrency(payslip.getBaseSalary()), normalFont));

            salaryTable.addCell(createCell("OT Pay", normalFont));
            salaryTable.addCell(createCell(formatCurrency(payslip.getOtPay()), normalFont));
            
            salaryTable.addCell(createCell("Allowance", normalFont));
            salaryTable.addCell(createCell(formatCurrency(payslip.getTotalAllowances()), normalFont));
            
            salaryTable.addCell(createCell("Absent Deduction", normalFont));
            salaryTable.addCell(createCell("-" + formatCurrency(payslip.getAbsentDeduction()), normalFont));

            salaryTable.addCell(createCell("Gross Salary", headFont));
            salaryTable.addCell(createCell(formatCurrency(payslip.getGrossSalary()), headFont));

            salaryTable.addCell(createCell("Tax (PIT)", normalFont));
            salaryTable.addCell(createCell("-" + formatCurrency(payslip.getTaxAmount()), normalFont));

            salaryTable.addCell(createCell("Insurance", normalFont));
            salaryTable.addCell(createCell("-" + formatCurrency(payslip.getInsuranceAmount()), normalFont));

            salaryTable.addCell(createCell("Net Salary", titleFont));
            salaryTable.addCell(createCell(formatCurrency(payslip.getNetSalary()), titleFont));

            document.add(salaryTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }

    public byte[] generateBankTransferPdf(com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse request, List<PayslipResponse> payslips) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            Paragraph title = new Paragraph("SALARY PAYMENT REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);
            
            infoTable.addCell(createCell("Request ID:", headFont));
            infoTable.addCell(createCell(request.getRequestId() != null ? request.getRequestId().toString() : "N/A", normalFont));
            infoTable.addCell(createCell("Batch ID:", headFont));
            infoTable.addCell(createCell(request.getPayrollBatchId() != null ? request.getPayrollBatchId().toString() : "N/A", normalFont));
            infoTable.addCell(createCell("Created At:", headFont));
            infoTable.addCell(createCell(formatDate(request.getCreatedAt()), normalFont));
            document.add(infoTable);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 3f, 2f, 2.5f, 2.5f});
            
            table.addCell(createCell("Emp ID", headFont));
            table.addCell(createCell("Employee Name", headFont));
            table.addCell(createCell("Bank Name", headFont));
            table.addCell(createCell("Bank Account", headFont));
            table.addCell(createCell("Net Salary (VND)", headFont));

            for (PayslipResponse p : payslips) {
                table.addCell(createCell(p.getEmployeeId() != null ? p.getEmployeeId().toString().substring(0, 8) : "N/A", normalFont));
                table.addCell(createCell(p.getEmployeeName(), normalFont));
                // TODO: Update when Employee entity has bank details
                table.addCell(createCell("N/A", normalFont));
                table.addCell(createCell("N/A", normalFont));
                table.addCell(createCell(formatCurrency(p.getNetSalary()), normalFont));
            }
            
            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }

    public byte[] generateTaxInsurancePdf(com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse request, List<com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse> reports) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 30, 30, 30, 30);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

            Paragraph title = new Paragraph("TAX & INSURANCE REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);
            
            infoTable.addCell(createCell("Request ID:", headFont));
            infoTable.addCell(createCell(request.getRequestId() != null ? request.getRequestId().toString() : "N/A", normalFont));
            infoTable.addCell(createCell("Batch ID:", headFont));
            infoTable.addCell(createCell(request.getPayrollBatchId() != null ? request.getPayrollBatchId().toString() : "N/A", normalFont));
            document.add(infoTable);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2.5f, 2f, 2f, 2f, 2f});
            
            table.addCell(createCell("Emp ID", headFont));
            table.addCell(createCell("Name", headFont));
            table.addCell(createCell("Gross", headFont));
            table.addCell(createCell("Insurance", headFont));
            table.addCell(createCell("Tax (PIT)", headFont));
            table.addCell(createCell("Net", headFont));

            for (com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse r : reports) {
                table.addCell(createCell(r.getEmployeeId() != null ? r.getEmployeeId().toString().substring(0, 8) : "N/A", normalFont));
                table.addCell(createCell(r.getEmployeeName(), normalFont));
                table.addCell(createCell(formatCurrency(r.getGrossSalary()), normalFont));
                table.addCell(createCell(formatCurrency(r.getInsuranceAmount()), normalFont));
                table.addCell(createCell(formatCurrency(r.getTaxAmount()), normalFont));
                table.addCell(createCell(formatCurrency(r.getNetSalary()), normalFont));
            }
            
            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(removeAccents(text), font));
        cell.setPadding(8);
        return cell;
    }

    private String removeAccents(String text) {
        if (text == null) return "N/A";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        String result = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return result.replace("Đ", "D").replace("đ", "d");
    }

    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        return new DecimalFormat("#,###").format(amount);
    }

    private String formatCurrency(Double amount) {
        if (amount == null) return "0";
        return new DecimalFormat("#,###").format(amount);
    }

    private String formatDate(java.time.OffsetDateTime date) {
        if (date == null) return "N/A";
        return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
