package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RealInterview {
    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(EmailRequest request) {

        String subject = "Interview Invitation - " + request.getTitle();

        String body = """
                Dear %s,

                Congratulations! You have passed the CV screening for the position: %s.

                You are invited to participate in the interview round.

                Time slot: %s

                If you have any questions, please contact:

                HR: %s

                Best regards,
                Recruitment Team
                """.formatted(
                request.getCandidateName(),
                request.getTitle(),
                request.getDate(),
                request.getHrName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getCanEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
