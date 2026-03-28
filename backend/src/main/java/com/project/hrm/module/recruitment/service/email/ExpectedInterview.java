package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service("ExpectedInterview")
@RequiredArgsConstructor
public class ExpectedInterview implements EmailService {
    private final JavaMailSender mailSender;

    @Async
    @Override
    public void sendEmail(EmailRequest request) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        String subject = "Interview Invitation - " + request.getTitle();

        String body = """
                Dear %s,

                Congratulations! You have passed the CV screening for the position: %s.

                You are invited to participate in the interview round.

                Please choose one of the following available time slots:

                09:00 – 11:30
                13:30 – 16:30

                You can select interview time from %s to %s

                If you have any questions, please contact:

                HR: %s

                Best regards,
                Recruitment Team
                """.formatted(
                request.getCandidateName(),
                request.getTitle(),
                request.getStart().format(formatter),
                request.getEnd().format(formatter),
                request.getHrName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getCanEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
