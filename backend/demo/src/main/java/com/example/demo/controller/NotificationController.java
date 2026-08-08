package com.example.demo.controller;

import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, String>> sendEmailNotification(@RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "Accepted");
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        String email = payload.getOrDefault("email", "candidate@example.com");

        boolean sent = emailService.sendStatusEmail(email, candidateName, status);

        Map<String, String> response = new HashMap<>();
        if (sent) {
            response.put("status", "success");
            response.put("message", "Email notification (" + status + ") sent to " + candidateName + " (" + email + ")");
        } else {
            response.put("status", "error");
            response.put("message", "Failed to send email to " + email);
        }

        return ResponseEntity.ok(response);
    }
}
