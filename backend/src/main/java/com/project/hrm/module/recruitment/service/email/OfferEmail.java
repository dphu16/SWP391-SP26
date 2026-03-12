package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Interview;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OfferEmail {
    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(Application app) {
        String title = app.getJob().getPos().getTitle();

        String subject = "Job Offer - " + title;

        String body = """
                Dear %s,

                Congratulations!

                We are pleased to offer you the position of %s.

                If you have any questions please contact:

                HR: %s

                Best regards,
                Recruitment Team
                """.formatted(
                app.getCandidate().getFullName(),
                title,
                app.getJob().getEmployee().getFullName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(app.getCandidate().getEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
