package com.example.demo.service;

import com.example.demo.model.Resume;
import com.example.demo.repository.ResumeRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    private static final List<String> COMMON_SKILLS = List.of(
            "Java", "Spring Boot", "MongoDB", "SQL", "Python", "JavaScript", "TypeScript",
            "React", "Node.js", "Docker", "Kubernetes", "AWS", "Git", "REST API", "HTML", "CSS", "Microservices"
    );

    @Autowired
    public ResumeService(ResumeRepository resumeRepository) {
        this.resumeRepository = resumeRepository;
    }

    public Resume saveResume(Resume resume) {
        return resumeRepository.save(resume);
    }

    public List<Resume> getAllResumes() {
        return resumeRepository.findAll();
    }

    /**
     * Extracts text from uploaded PDF file using Apache PDFBox, parses basic candidate info,
     * and saves the Resume entity to MongoDB.
     *
     * @param file uploaded MultipartFile PDF
     * @return saved Resume entity
     * @throws IOException if PDF reading fails
     */
    public Resume parseAndSaveResume(MultipartFile file) throws IOException {
        String extractedText;

        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            extractedText = pdfStripper.getText(document);
        }

        String candidateName = extractCandidateName(extractedText, file.getOriginalFilename());
        String email = extractEmail(extractedText);
        String phone = extractPhone(extractedText);
        String skills = extractSkills(extractedText);

        Resume resume = new Resume();
        resume.setCandidateName(candidateName);
        resume.setEmail(email);
        resume.setPhone(phone);
        resume.setSkills(skills);
        resume.setContent(extractedText);

        return resumeRepository.save(resume);
    }

    private String extractCandidateName(String text, String originalFilename) {
        if (text != null && !text.isBlank()) {
            String[] lines = text.split("\\r?\\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && trimmed.length() < 50 && !trimmed.contains("@")) {
                    return trimmed;
                }
            }
        }
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        }
        return "Unknown Candidate";
    }

    private String extractEmail(String text) {
        if (text == null) return "Not Found";
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return "Not Found";
    }

    private String extractPhone(String text) {
        if (text == null) return "Not Found";
        Matcher matcher = PHONE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return "Not Found";
    }

    private String extractSkills(String text) {
        if (text == null) return "Not Specified";
        List<String> foundSkills = new ArrayList<>();
        for (String skill : COMMON_SKILLS) {
            if (text.toLowerCase().contains(skill.toLowerCase())) {
                foundSkills.add(skill);
            }
        }
        return foundSkills.isEmpty() ? "Not Specified" : String.join(", ", foundSkills);
    }
}
