package com.project.hrm.module.payroll.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.project.hrm.module.payroll.dto.PayslipDetailDTO;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

@Service
public class EmployeePayslipPdfService {

    private static final DecimalFormat VND_FORMAT = new DecimalFormat("#,### đ");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generatePayslipPdf(PayslipDetailDTO payslipDTO, String employeeName) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Setup Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            // Tựa đề Phiếu lương
            Paragraph title = new Paragraph("PAYSLIP", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Thông tin chung
            document.add(new Paragraph("Employee Name: " + employeeName, boldFont));
            document.add(
                    new Paragraph("Period: Month " + payslipDTO.getMonth() + "/" + payslipDTO.getYear(), normalFont));
            String dateRange = (payslipDTO.getStartDate() != null ? payslipDTO.getStartDate().format(DATE_FORMAT) : "")
                    +
                    " - " +
                    (payslipDTO.getEndDate() != null ? payslipDTO.getEndDate().format(DATE_FORMAT) : "");
            document.add(new Paragraph("Period Date: " + dateRange, normalFont));
            String statusAndPaidDate = "Status: " + payslipDTO.getStatus();
            if (payslipDTO.getPaidAt() != null) {
                statusAndPaidDate += " (Paid: " + payslipDTO.getPaidAt().format(DATE_FORMAT) + ")";
            }
            Paragraph statusPara = new Paragraph(statusAndPaidDate, normalFont);
            statusPara.setSpacingAfter(15);
            document.add(statusPara);

            // Bảng chính
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 6f, 4f });
            table.setSpacingBefore(10);

            // Header 1: Thu nhập
            PdfPCell cell = new PdfPCell(new Phrase("INCOME", headerFont));
            cell.setColspan(2);
            cell.setBackgroundColor(new java.awt.Color(209, 250, 229)); // emerald-100
            cell.setPadding(6f);
            table.addCell(cell);

            // Items thu nhập
            addTableRow(table, "Base Salary", payslipDTO.getBaseSalary(), normalFont);
            addTableRow(table, "Allowances", payslipDTO.getTotalAllowances(), normalFont);
            if (payslipDTO.getItems() != null) {
                for (PayslipDetailDTO.PayslipItemDto item : payslipDTO.getItems()) {
                    if ("INCOME".equals(item.getType())) {
                        addTableRow(table, item.getItemName(), item.getAmount(), normalFont);
                    }
                }
            }
            addTableRowBold(table, "Gross Salary", payslipDTO.getGrossSalary(), boldFont);

            // Spacer
            PdfPCell spacer = new PdfPCell(new Phrase(" "));
            spacer.setColspan(2);
            spacer.setBorder(Rectangle.NO_BORDER);
            table.addCell(spacer);

            // Header 2: Giảm trừ
            PdfPCell cell2 = new PdfPCell(new Phrase("DEDUCTIONS", headerFont));
            cell2.setColspan(2);
            cell2.setBackgroundColor(new java.awt.Color(254, 226, 226)); // rose-100
            cell2.setPadding(6f);
            table.addCell(cell2);

            addTableRow(table, "Tax", payslipDTO.getTaxAmount(), normalFont);
            addTableRow(table, "Insurance", payslipDTO.getInsuranceAmount(), normalFont);
            if (payslipDTO.getItems() != null) {
                for (PayslipDetailDTO.PayslipItemDto item : payslipDTO.getItems()) {
                    if ("DEDUCTION".equals(item.getType())) {
                        addTableRow(table, item.getItemName(), item.getAmount(), normalFont);
                    }
                }
            }
            addTableRowBold(table, "Total Deductions", payslipDTO.getTotalDeductions(), boldFont);

            // Spacer
            table.addCell(spacer);

            // Lương Thực Nhận (Net Pay)
            PdfPCell netCell = new PdfPCell(new Phrase("NET PAY", headerFont));
            netCell.setBackgroundColor(new java.awt.Color(204, 251, 241)); // teal-100
            netCell.setPadding(10f);
            table.addCell(netCell);

            PdfPCell netValueCell = new PdfPCell(new Phrase(formatVnd(payslipDTO.getNetSalary()), headerFont));
            netValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            netValueCell.setBackgroundColor(new java.awt.Color(204, 251, 241));
            netValueCell.setPadding(10f);
            table.addCell(netValueCell);

            document.add(table);
            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error while generating PDF", e);
        }

        return out.toByteArray();
    }

    private void addTableRow(PdfPTable table, String name, BigDecimal amount, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(name, font));
        c1.setPadding(5f);
        PdfPCell c2 = new PdfPCell(new Phrase(formatVnd(amount), font));
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(5f);
        table.addCell(c1);
        table.addCell(c2);
    }

    private void addTableRowBold(PdfPTable table, String name, BigDecimal amount, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(name, font));
        c1.setPadding(6f);
        c1.setBackgroundColor(new java.awt.Color(241, 245, 249)); // slate-100
        PdfPCell c2 = new PdfPCell(new Phrase(formatVnd(amount), font));
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(6f);
        c2.setBackgroundColor(new java.awt.Color(241, 245, 249));
        table.addCell(c1);
        table.addCell(c2);
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null)
            return "0 đ";
        return VND_FORMAT.format(amount);
    }
}
