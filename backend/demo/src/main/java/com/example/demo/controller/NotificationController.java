package com.example.demo.controller;

import com.example.demo.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class NotificationController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, String>> sendEmailNotification(@RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "Accepted");
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        String email = payload.getOrDefault("email", "");

        if (email == null || email.trim().isEmpty() || "Not Found".equalsIgnoreCase(email.trim())) {
            Map<String, String> err = new HashMap<>();
            err.put("status", "error");
            err.put("message", "Candidate has no valid email address saved.");
            return ResponseEntity.badRequest().body(err);
        }

        boolean sent = emailService.sendStatusEmail(email, candidateName, status);

        Map<String, String> response = new HashMap<>();
        if (sent) {
            response.put("status", "success");
            response.put("message", "Notification email (" + status + ") sent to " + candidateName + " (" + email + ")");
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Gmail SMTP Authentication failed for recipient " + email + ". Check App Password in .env.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
