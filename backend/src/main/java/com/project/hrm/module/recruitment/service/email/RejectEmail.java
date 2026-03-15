package com.project.hrm.module.recruitment.service.email;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RejectEmail {
    private final JavaMailSender mailSender;

    @Async
    public void sendEmail(EmailRequest request) {

        String subject = "Interview Invitation - " + request.getTitle();

        String body = """
                Dear %s,
                
                Thank you for your interest in the position: %s and for taking the time to participate in our recruitment process.
                
                After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
                
                We truly appreciate the effort you invested and encourage you to apply again in the future should another opportunity match your profile.
                
                If you have any questions, please contact:
                
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
