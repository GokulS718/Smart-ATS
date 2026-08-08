package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @PostMapping("/send-email")
    public ResponseEntity<Map<String, String>> sendEmailNotification(@RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "Accepted");
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        String email = payload.getOrDefault("email", "candidate@example.com");
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification email (" + status + ") sent to " + candidateName + " (" + email + ")"
        ));
    }
}
