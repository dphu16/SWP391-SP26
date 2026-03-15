package com.project.hrm.module.corehr.service.helper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendActivationEmail(String toEmail, String employeeName, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Kích hoạt tài khoản nhân viên - HRM System");

            String activationLink = frontendUrl + "/activation?token=" + token;

            String htmlContent = buildActivationEmailHtml(employeeName, activationLink);
            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Activation email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send activation email to: {}", toEmail, e);
        }
    }

    private String buildActivationEmailHtml(String employeeName, String activationLink) {
        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">"
                + "<h2 style=\"color: #2563eb;\">Chào mừng " + escapeHtml(employeeName) + " đến với công ty!</h2>"
                + "<p>Tài khoản của bạn đã được phê duyệt. Vui lòng nhấn vào liên kết bên dưới để kích hoạt tài khoản:</p>"
                + "<div style=\"text-align: center; margin: 30px 0;\">"
                + "<a href=\"" + activationLink + "\" "
                + "style=\"background-color: #2563eb; color: white; padding: 12px 30px; "
                + "text-decoration: none; border-radius: 6px; font-size: 16px;\">"
                + "Kích hoạt tài khoản</a></div>"
                + "<p style=\"color: #6b7280; font-size: 14px;\">"
                + "Lưu ý: Liên kết này chỉ sử dụng được <strong>một lần duy nhất</strong>.</p>"
                + "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;\">"
                + "<p style=\"color: #9ca3af; font-size: 12px;\">HRM System - Human Resource Management</p>"
                + "</div>";
    }


    private String escapeHtml(String input) {
        if (input == null)
            return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
