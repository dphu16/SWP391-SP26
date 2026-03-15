package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class UploadCV {

    private final JavaMailSender mailSender;

    public UploadCV(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendEmail(EmailRequest request) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(request.getCanEmail());
            helper.setSubject("Application Submitted Successfully");

            String content = """
            <p>Dear %s,</p>

            <p>You have successfully applied for: <b>%s</b>.</p>
            <p>We will contact you via Email or phone number: <b>%s</b>.</p>
            <p>Your CV is attached below.</p>

            <br>
            <p>HR Team</p>
            """.formatted(
                    request.getCandidateName(),
                    request.getTitle(),
                    request.getCanPhone()
            );

            helper.setText(content, true);

            // đường dẫn file CV
            File file = new File("uploads/" + request.getCvUrl());

            FileSystemResource resource = new FileSystemResource(file);

            // attach file
            helper.addAttachment("CV_" + request.getCandidateName() + ".pdf", resource);

            mailSender.send(message);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}