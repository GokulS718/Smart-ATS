package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public boolean sendStatusEmail(String toEmail, String candidateName, String status) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            System.err.println("Email recipient address is missing or empty.");
            return false;
        }

        String subject;
        String text;

        if ("Accepted".equalsIgnoreCase(status)) {
            subject = "Congratulations! Your Application for Smart-ATS";
            text = "Dear " + (candidateName != null ? candidateName : "Candidate") + ",\n\n"
                    + "We are pleased to inform you that your resume has been shortlisted for the next phase of our selection process.\n\n"
                    + "Our HR team will reach out to you shortly with details regarding the next interview steps.\n\n"
                    + "Best regards,\n"
                    + "Smart-ATS Recruitment Team";
        } else if ("Rejected".equalsIgnoreCase(status)) {
            subject = "Update on Your Application for Smart-ATS";
            text = "Dear " + (candidateName != null ? candidateName : "Candidate") + ",\n\n"
                    + "Thank you for taking the time to apply and share your profile with us.\n\n"
                    + "After careful consideration of your application against our current technical requirements, we regret to inform you that we will not be moving forward with your candidacy at this time.\n\n"
                    + "We wish you all the best in your professional endeavors.\n\n"
                    + "Best regards,\n"
                    + "Smart-ATS Recruitment Team";
        } else {
            subject = "Application Status Update - Smart-ATS";
            text = "Dear " + (candidateName != null ? candidateName : "Candidate") + ",\n\n"
                    + "Your application status has been updated to: " + status + ".\n\n"
                    + "Best regards,\n"
                    + "Smart-ATS Recruitment Team";
        }

        try {
            if (mailSender != null) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                System.out.println("Email successfully sent to " + toEmail);
                return true;
            } else {
                System.out.println("[Simulation Mode] JavaMailSender not loaded. Email to " + toEmail + " logged.");
                return true;
            }
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            return false;
        }
    }
}
