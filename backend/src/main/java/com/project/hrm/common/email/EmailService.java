package com.project.hrm.common.email;

import com.project.hrm.module.recruitment.entity.Application;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

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

            String content = """
            <p>Dear %s,</p>

            <p>You have successfully applied for: <b>%s</b>.</p>
            <p>We will contact you via Email or phone number: <b>%s</b>.</p>
            <p>Your CV is attached below.</p>

            <br>
            <p>HR Team</p>
            """.formatted(
                    app.getCandidate().getFullName(),
                    app.getJob().getTitle(),
                    app.getCandidate().getPhone()
            );

            helper.setText(content, true);

            // đường dẫn file CV
            File file = new File("uploads/" + app.getCvUrl());

            FileSystemResource resource = new FileSystemResource(file);

            // attach file
            helper.addAttachment("CV_" + app.getCandidate().getFullName() + ".pdf", resource);

            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}