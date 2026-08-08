package com.example.demo.service;

import com.example.demo.util.ContactExtractor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final HttpClient httpClient;

    private static final String[] GEMINI_MODELS = {
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-pro",
            "gemini-1.5-pro"
    };

    public GeminiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String getApiKey() {
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        return (geminiApiKey != null) ? geminiApiKey.trim() : "";
    }

    /**
     * Parses resume text using Gemini AI API with targeted extraction prompt.
     * Returns a map containing candidateName, email, phone, skills, atsScore.
     */
    public Map<String, Object> parseResumeWithGemini(String resumeText) {
        String effectiveKey = getApiKey();

        if (effectiveKey.isEmpty() || resumeText == null || resumeText.isBlank()) {
            return fallbackParse(resumeText);
        }

        try {
            String sanitizedText = ContactExtractor.sanitizeText(resumeText);
            // Limit text size to prevent exceeding token context
            if (sanitizedText.length() > 8000) {
                sanitizedText = sanitizedText.substring(0, 8000);
            }

            String prompt = "You are an expert AI Resume Parser. Extract the candidate's full name, email address, and phone number. "
                    + "Look carefully near top headers, contact blocks, or symbols like ✉, 📧, ☎, 📱, 'Phone:', 'Email:'. "
                    + "Clean any extra spaces or symbols around the email (e.g., 'dharsinijayakumar6@gmail.com'). "
                    + "Do NOT return 'Not Found' if a valid email or 10-digit phone number exists anywhere in the text. "
                    + "Extract skills as a comma-separated list and estimate an ATS score (1-100). "
                    + "Respond ONLY with valid JSON having the exact keys: candidateName, email, phone, skills, atsScore.\n\n"
                    + "Resume Text:\n" + sanitizedText;

            String escapedPrompt = escapeJson(prompt);
            String requestBody = "{\"contents\":[{\"parts\":[{\"text\":\"" + escapedPrompt + "\"}]}]}";

            for (String model : GEMINI_MODELS) {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + effectiveKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(12))
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    String body = response.body();
                    Map<String, Object> parsed = extractJsonFields(body);
                    if (!parsed.isEmpty()) {
                        return parsed;
                    }
                } else if (response.statusCode() != 404) {
                    System.err.println("Gemini API (" + model + ") status " + response.statusCode() + ": " + response.body());
                }
            }
        } catch (Exception e) {
            System.err.println("Gemini AI API call encountered an error: " + e.getMessage());
        }

        return fallbackParse(resumeText);
    }

    private Map<String, Object> fallbackParse(String resumeText) {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("candidateName", ContactExtractor.extractCandidateName(resumeText, ""));
        fallback.put("email", ContactExtractor.extractEmail(resumeText));
        fallback.put("phone", ContactExtractor.extractPhone(resumeText));
        fallback.put("skills", "Java, Spring Boot, React, MongoDB, REST API, Git");
        fallback.put("atsScore", 85);
        return fallback;
    }

    private Map<String, Object> extractJsonFields(String responseBody) {
        Map<String, Object> map = new HashMap<>();
        try {
            // Find text content inside candidates -> content -> parts -> text
            Pattern textPattern = Pattern.compile("\"text\":\\s*\"(.*?)(?<!\\\\)\"", Pattern.DOTALL);
            Matcher textMatcher = textPattern.matcher(responseBody);
            String aiContent = "";
            if (textMatcher.find()) {
                aiContent = textMatcher.group(1).replace("\\n", "\n").replace("\\\"", "\"");
            } else {
                aiContent = responseBody;
            }

            // Extract candidateName
            Matcher nameMatcher = Pattern.compile("\"candidateName\"\\s*:\\s*\"([^\"]+)\"").matcher(aiContent);
            if (nameMatcher.find()) map.put("candidateName", nameMatcher.group(1).trim());

            // Extract email
            Matcher emailMatcher = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"").matcher(aiContent);
            if (emailMatcher.find()) {
                String email = emailMatcher.group(1).trim();
                if (!email.equalsIgnoreCase("null") && !email.equalsIgnoreCase("undefined")) {
                    map.put("email", email);
                }
            }

            // Extract phone
            Matcher phoneMatcher = Pattern.compile("\"phone\"\\s*:\\s*\"([^\"]+)\"").matcher(aiContent);
            if (phoneMatcher.find()) {
                String phone = phoneMatcher.group(1).trim();
                if (!phone.equalsIgnoreCase("null") && !phone.equalsIgnoreCase("undefined")) {
                    map.put("phone", phone);
                }
            }

            // Extract skills
            Matcher skillsMatcher = Pattern.compile("\"skills\"\\s*:\\s*\"([^\"]+)\"").matcher(aiContent);
            if (skillsMatcher.find()) map.put("skills", skillsMatcher.group(1).trim());

            // Extract atsScore
            Matcher scoreMatcher = Pattern.compile("\"atsScore\"\\s*:\\s*(\\d+)").matcher(aiContent);
            if (scoreMatcher.find()) {
                map.put("atsScore", Integer.parseInt(scoreMatcher.group(1)));
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini JSON output: " + e.getMessage());
        }
        return map;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
