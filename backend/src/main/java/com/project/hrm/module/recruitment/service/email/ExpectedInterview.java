package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.entity.Application;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExpectedInterview {
    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(Application app, String title) {

        String subject = "Interview Invitation - " + title;

        String body = """
                Dear %s,

                Congratulations! You have passed the CV screening for the position: %s.

                You are invited to participate in the interview round.

                Please choose one of the following available time slots:

                09:00 – 11:30
                13:30 – 16:30

                You can select interview time from %s ro %s

                If you have any questions, please contact:

                HR: %s

                Best regards,
                Recruitment Team
                """.formatted(
                app.getCandidate().getFullName(),
                title,
                app.getStart(),
                app.getEnd(),
                app.getJob().getEmployee().getFullName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(app.getCandidate().getEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
