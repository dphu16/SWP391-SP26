package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import com.project.hrm.module.recruitment.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service("OfferEmail")
@RequiredArgsConstructor
public class OfferEmail implements EmailService {
    private final JavaMailSender mailSender;

    @Async
    @Override
    public void sendEmail(EmailRequest request) {

        String subject = "Job Offer - " + request.getTitle();

        String body = """
                Dear %s,

                Congratulations!

                We are pleased to offer you the position of %s.

                If you have any questions please contact:

                HR: %s

                Best regards,
                Recruitment Team
                """.formatted(
                request.getCandidateName(),
                request.getTitle(),
                request.getHrName()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getCanEmail());
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
