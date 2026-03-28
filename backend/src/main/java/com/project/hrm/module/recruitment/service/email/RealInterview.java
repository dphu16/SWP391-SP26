package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service("RealInterview")
@RequiredArgsConstructor
public class RealInterview implements EmailService {
    private final JavaMailSender mailSender;

    @Async
    @Override
    public void sendEmail(EmailRequest request) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

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
                request.getDate().format(formatter),
                request.getHrName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getCanEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
