package com.example.demo.service;

import com.example.demo.dto.ATSEvaluationResponse;
import com.example.demo.model.Evaluation;
import com.example.demo.model.Resume;
import com.example.demo.repository.EvaluationRepository;
import com.example.demo.repository.ResumeRepository;
import com.example.demo.util.ContactExtractor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final EvaluationRepository evaluationRepository;
    private final GeminiService geminiService;

    private static final List<String> COMMON_SKILLS = List.of(
            "Java", "Spring Boot", "MongoDB", "SQL", "Python", "JavaScript", "TypeScript",
            "React", "Node.js", "Docker", "Kubernetes", "AWS", "Git", "REST API", "HTML", "CSS", "Microservices",
            "Kafka", "Redis", "CI/CD", "Jenkins", "Agile", "Scrum", "JUnit", "PostgreSQL", "MySQL"
    );

    @Autowired
    public ResumeService(ResumeRepository resumeRepository, 
                         EvaluationRepository evaluationRepository, 
                         GeminiService geminiService) {
        this.resumeRepository = resumeRepository;
        this.evaluationRepository = evaluationRepository;
        this.geminiService = geminiService;
    }

    public Resume saveResume(Resume resume) {
        return resumeRepository.save(resume);
    }

    public List<Resume> getAllResumes() {
        return resumeRepository.findAll();
    }

    public Optional<Resume> getResumeById(String id) {
        return resumeRepository.findById(id);
    }

    public Resume updateResumeStatus(String id, String status) {
        Optional<Resume> optional = resumeRepository.findById(id);
        if (optional.isPresent()) {
            Resume r = optional.get();
            r.setStatus(status);
            return resumeRepository.save(r);
        }
        return null;
    }

    public Resume updateResumeScoreAndStatus(String id, String status, Integer atsScore) {
        Optional<Resume> optional = resumeRepository.findById(id);
        if (optional.isPresent()) {
            Resume r = optional.get();
            if (status != null && !status.isBlank()) {
                r.setStatus(status);
            }
            if (atsScore != null && atsScore > 0) {
                r.setAtsScore(atsScore);
            }
            return resumeRepository.save(r);
        }
        return null;
    }

    /**
     * Deletes a candidate resume by MongoDB ID.
     */
    public boolean deleteResume(String id) {
        if (resumeRepository.existsById(id)) {
            resumeRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Resume parseAndSaveResume(MultipartFile file) throws IOException {
        return parseAndSaveResume(file, null);
    }

    /**
     * Parses PDF resume using a robust two-step pipeline:
     * Step 1: Fast & accurate Regex extraction via ContactExtractor with Unicode sanitization and LinkedIn splitting.
     * Step 2: Fallback to Gemini AI if email or phone is missing or "Not Found".
     * Persists exact synchronized atsScore.
     */
    public Resume parseAndSaveResume(MultipartFile file, Integer clientAtsScore) throws IOException {
        String extractedText;

        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            extractedText = pdfStripper.getText(document);
        }

        // Step 1: Extract directly via ContactExtractor (Regex, Unicode Cleaning, Indian Phone Normalization)
        String candidateName = ContactExtractor.extractCandidateName(extractedText, file.getOriginalFilename());
        String email = ContactExtractor.extractEmail(extractedText);
        String phone = ContactExtractor.extractPhone(extractedText);
        String skills = extractSkills(extractedText);
        List<String> matchedSkillList = extractSkillList(extractedText);

        // Step 2: If email or phone returns "Not Found", fall back to Gemini AI parser
        if ("Not Found".equalsIgnoreCase(email) || "Not Found".equalsIgnoreCase(phone) || email == null || phone == null) {
            try {
                Map<String, Object> geminiResult = geminiService.parseResumeWithGemini(extractedText);
                if (geminiResult != null && !geminiResult.isEmpty()) {
                    if (("Not Found".equalsIgnoreCase(email) || email == null) && geminiResult.get("email") != null) {
                        String geminiEmail = geminiResult.get("email").toString().trim();
                        String cleanedEmail = ContactExtractor.extractEmail(geminiEmail);
                        if (!cleanedEmail.equalsIgnoreCase("Not Found")) {
                            email = cleanedEmail;
                        } else if (!geminiEmail.isEmpty() && !geminiEmail.equalsIgnoreCase("Not Found") && !geminiEmail.equalsIgnoreCase("null")) {
                            email = geminiEmail;
                        }
                    }

                    if (("Not Found".equalsIgnoreCase(phone) || phone == null) && geminiResult.get("phone") != null) {
                        String geminiPhone = geminiResult.get("phone").toString().trim();
                        String cleanedPhone = ContactExtractor.extractPhone(geminiPhone);
                        if (!cleanedPhone.equalsIgnoreCase("Not Found")) {
                            phone = cleanedPhone;
                        } else if (!geminiPhone.isEmpty() && !geminiPhone.equalsIgnoreCase("Not Found") && !geminiPhone.equalsIgnoreCase("null")) {
                            phone = geminiPhone;
                        }
                    }

                    if (("Candidate".equalsIgnoreCase(candidateName) || "Unknown Candidate".equalsIgnoreCase(candidateName)) 
                            && geminiResult.get("candidateName") != null) {
                        String geminiName = geminiResult.get("candidateName").toString().trim();
                        if (!geminiName.isEmpty()) {
                            candidateName = geminiName;
                        }
                    }

                    if (("Not Specified".equalsIgnoreCase(skills) || skills.isEmpty()) && geminiResult.get("skills") != null) {
                        skills = geminiResult.get("skills").toString();
                    }
                }
            } catch (Exception ex) {
                System.err.println("Gemini AI fallback parsing failed: " + ex.getMessage());
            }
        }

        // Final sanitation check & fallback
        if (email == null || email.isBlank() || "Not Found".equalsIgnoreCase(email)) {
            email = ContactExtractor.extractEmail(extractedText);
        }
        if (phone == null || phone.isBlank() || "Not Found".equalsIgnoreCase(phone)) {
            phone = ContactExtractor.extractPhone(extractedText);
        }

        Resume resume = new Resume();
        resume.setCandidateName(candidateName);
        resume.setEmail(email);
        resume.setPhone(phone);
        resume.setSkills(skills);
        resume.setContent(extractedText);
        resume.setStatus("Pending");
        resume.setMatchedSkills(matchedSkillList);

        // Synchronize ATS score: Use client score if provided, else compute based on matched skills
        if (clientAtsScore != null && clientAtsScore > 0) {
            resume.setAtsScore(clientAtsScore);
        } else {
            int computedScore = Math.min(95, Math.max(45, matchedSkillList.size() * 18));
            resume.setAtsScore(computedScore);
        }

        return resumeRepository.save(resume);
    }

    /**
     * Evaluates a Resume text against a Job Description, saves the Evaluation document
     * into MongoDB via EvaluationRepository, and returns ATSEvaluationResponse.
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

    private String extractSkills(String text) {
        List<String> foundSkills = extractSkillList(text);
        return foundSkills.isEmpty() ? "Not Specified" : String.join(", ", foundSkills);
    }

    private List<String> extractSkillList(String text) {
        if (text == null) return Collections.emptyList();
        List<String> foundSkills = new ArrayList<>();
        for (String skill : COMMON_SKILLS) {
            if (text.toLowerCase().contains(skill.toLowerCase())) {
                foundSkills.add(skill);
            }
        }
        return foundSkills;
    }
}
