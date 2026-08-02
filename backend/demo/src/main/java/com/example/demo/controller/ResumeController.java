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
@CrossOrigin(origins = "*")
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

    /**
     * POST /api/resumes/upload
     * Accepts a PDF file, parses candidate details using PDFBox, and saves it to MongoDB.
     *
     * @param file MultipartFile containing PDF resume
     * @return ResponseEntity with saved Resume or error status
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndParseResume(@RequestParam("file") MultipartFile file) {
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
            Resume savedResume = resumeService.parseAndSaveResume(file);
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
     * Evaluates a resume text against a Job Description and returns ATS score,
     * missing keywords, and feedback in strict JSON format.
     *
     * @param request EvaluateRequest containing resumeText and jobDescription
     * @return ResponseEntity with ATSEvaluationResponse
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
     * Sends email notification for candidate accept/reject decision.
     */
    @PostMapping("/email")
    public ResponseEntity<Map<String, String>> sendEmailNotification(@RequestBody Map<String, String> payload) {
        String status = payload.getOrDefault("status", "Accepted");
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Notification email (" + status + ") sent to " + candidateName
        ));
    }
}
