package com.example.demo.service;

import com.example.demo.dto.ATSEvaluationResponse;
import com.example.demo.model.Evaluation;
import com.example.demo.model.Resume;
import com.example.demo.repository.EvaluationRepository;
import com.example.demo.repository.ResumeRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final EvaluationRepository evaluationRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    private static final List<String> COMMON_SKILLS = List.of(
            "Java", "Spring Boot", "MongoDB", "SQL", "Python", "JavaScript", "TypeScript",
            "React", "Node.js", "Docker", "Kubernetes", "AWS", "Git", "REST API", "HTML", "CSS", "Microservices",
            "Kafka", "Redis", "CI/CD", "Jenkins", "Agile", "Scrum", "JUnit", "PostgreSQL", "MySQL"
    );

    @Autowired
    public ResumeService(ResumeRepository resumeRepository, EvaluationRepository evaluationRepository) {
        this.resumeRepository = resumeRepository;
        this.evaluationRepository = evaluationRepository;
    }

    public Resume saveResume(Resume resume) {
        return resumeRepository.save(resume);
    }

    public List<Resume> getAllResumes() {
        return resumeRepository.findAll();
    }

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

    /**
     * Evaluates a Resume text against a Job Description, saves the Evaluation document
     * into MongoDB via EvaluationRepository, and returns ATSEvaluationResponse.
     *
     * @param resumeText text content of the candidate's resume
     * @param jobDescription text content of the target job description
     * @return ATSEvaluationResponse with matchPercentage, missingKeywords, and feedback
     */
    public ATSEvaluationResponse evaluateResumeAgainstJD(String resumeText, String jobDescription) {
        if (jobDescription == null || jobDescription.isBlank()) {
            return new ATSEvaluationResponse(0, List.of(), "Job description cannot be empty for evaluation.");
        }
        String lowerResume = (resumeText == null) ? "" : resumeText.toLowerCase();

        Set<String> jdKeywords = extractKeywordsFromJD(jobDescription);
        if (jdKeywords.isEmpty()) {
            return new ATSEvaluationResponse(100, List.of(), "Job description contains no specific technical keywords to evaluate.");
        }

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String keyword : jdKeywords) {
            if (lowerResume.contains(keyword.toLowerCase())) {
                matched.add(keyword);
            } else {
                missing.add(keyword);
            }
        }

        int matchPercentage = (int) Math.round(((double) matched.size() / jdKeywords.size()) * 100);

        String feedback;
        if (missing.isEmpty()) {
            feedback = "Excellent match! Your resume incorporates all core technical skills required in the job description.";
        } else {
            feedback = "Consider adding experience or projects highlighting " +
                    String.join(", ", missing.subList(0, Math.min(3, missing.size()))) +
                    " to better align with this job description.";
        }

        // Save evaluation result directly into MongoDB via EvaluationRepository
        Evaluation evaluation = new Evaluation(matchPercentage, missing, feedback);
        evaluationRepository.save(evaluation);

        return new ATSEvaluationResponse(matchPercentage, missing, feedback);
    }

    private Set<String> extractKeywordsFromJD(String jobDescription) {
        Set<String> found = new LinkedHashSet<>();
        for (String skill : COMMON_SKILLS) {
            if (jobDescription.toLowerCase().contains(skill.toLowerCase())) {
                found.add(skill);
            }
        }
        if (found.size() < 3) {
            String[] words = jobDescription.split("\\W+");
            for (String word : words) {
                if (word.length() > 4 && Character.isUpperCase(word.charAt(0))) {
                    found.add(word);
                }
            }
        }
        return found;
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
