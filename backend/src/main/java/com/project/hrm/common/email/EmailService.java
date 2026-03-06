package com.project.hrm.common.email;

import com.project.hrm.module.recruitment.entity.Application;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendApplicationSuccessEmail(Application app) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(app.getCandidate().getEmail());
            helper.setSubject("Application Submitted Successfully");

            String cvUrl = "http://localhost:8080" + app.getCvUrl();

            String content = """
                <p>Dear %s,</p>

                <p>You have successfully applied for: <b>%s</b>.</p>

                <p>Here is your CV:</p>

                <a href="%s">View your CV</a>

                <br><br>
                <p>HR Team</p>
                """.formatted(
                    app.getCandidate().getFullName(),
                    app.getJob().getTitle(),
                    cvUrl
            );

            helper.setText(content, true); // true = HTML email

            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}