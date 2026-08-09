package com.example.demo.controller;

import com.example.demo.dto.ATSEvaluationResponse;
import com.example.demo.dto.EvaluateRequest;
import com.example.demo.model.Resume;
import com.example.demo.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ResumeController {

    private final ResumeService resumeService;

    @Autowired
    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping
    public ResponseEntity<Resume> saveResume(@RequestBody Resume resume) {
        Resume savedResume = resumeService.saveResume(resume);
        return new ResponseEntity<>(savedResume, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Resume>> getAllResumes() {
        List<Resume> resumes = resumeService.getAllResumes();
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Resume>> getAllResumesEndpoint() {
        List<Resume> resumes = resumeService.getAllResumes();
        return ResponseEntity.ok(resumes);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("id") String id, @RequestBody Map<String, Object> body) {
        String newStatus = body.get("status") != null ? body.get("status").toString() : null;
        Integer atsScore = null;
        if (body.get("atsScore") != null) {
            try {
                atsScore = Integer.parseInt(body.get("atsScore").toString());
            } catch (NumberFormatException ignored) {}
        }

        Resume updated = resumeService.updateResumeScoreAndStatus(id, newStatus, atsScore);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Resume not found with id: " + id));
        }
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/resumes/{id}
     * Deletes a candidate resume from MongoDB by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@PathVariable("id") String id) {
        boolean deleted = resumeService.deleteResume(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully", "id", id));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Resume not found with id: " + id));
    }

    /**
     * POST /api/resumes/upload
     * Accepts a PDF file and optional atsScore, parses candidate details using PDFBox, and saves it to MongoDB.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndParseResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "atsScore", required = false) Integer atsScore
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to process empty file."));
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        boolean isPdfExtension = originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf");
        boolean isPdfContentType = contentType != null && (
                contentType.equalsIgnoreCase("application/pdf") || 
                contentType.equalsIgnoreCase("application/octet-stream")
        );

        if (!isPdfExtension && !isPdfContentType) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid file format. Only PDF files are accepted."));
        }

        try {
            Resume savedResume = resumeService.parseAndSaveResume(file, atsScore);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedResume);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error reading or parsing PDF file: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred while processing the resume: " + e.getMessage()));
        }
    }

    /**
     * POST /api/resumes/evaluate
     */
    @PostMapping("/evaluate")
    public ResponseEntity<ATSEvaluationResponse> evaluateResume(@RequestBody EvaluateRequest request) {
        ATSEvaluationResponse response = resumeService.evaluateResumeAgainstJD(
                request.getResumeText(),
                request.getJobDescription()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/resumes/email
     */
    @PostMapping("/email")
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
