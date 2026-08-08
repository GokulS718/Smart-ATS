package com.example.demo.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ContactExtractor {

    // Regex for standard Email Extraction
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
            Pattern.CASE_INSENSITIVE
    );

    // Regex matching email concatenated with LinkedIn path or missing .com e.g. "vijaykumarasamyvkps@gmailin/vijaykumarasamy/"
    private static final Pattern CONCAT_EMAIL_PATTERN = Pattern.compile(
            "([a-zA-Z0-9._%+-]+)@(gmail|yahoo|outlook|hotmail|in|[a-zA-Z0-9.-]+?)(?:[\\/]|in[\\/]|in|linkedin|\\.com|\\.in|\\.org|\\.net|$)",
            Pattern.CASE_INSENSITIVE
    );

    // Regex for 10-digit Indian numbers formatted with spaces or country codes:
    // e.g., +91 75982 02292, 75982 02292, +91-75982-02292, 6374013615
    private static final Pattern INDIAN_PHONE_PATTERN = Pattern.compile(
            "(?:(?:\\+|00)91[\\s.-]?)?[6-9]\\d{4}[\\s.-]?\\d{5}|(?:(?:\\+|00)91[\\s.-]?)?[6-9]\\d{9}"
    );

    // Regex for international phone numbers
    private static final Pattern INTL_PHONE_PATTERN = Pattern.compile(
            "\\+?\\d{1,4}?[\\s.-]?\\(?\\d{1,3}?\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}"
    );

    // Unicode contact icons and contact prefixes to strip (✉, ☎, 📱, 📧, 📞, 📇, 🔗)
    private static final Pattern UNICODE_SYMBOLS_PATTERN = Pattern.compile(
            "[\\u2700-\\u27BF\\u2600-\\u26FF\\uD83C-\\uDBFF\\uDC00-\\uDFFF\\uFE00-\\uFE0F\\u200B-\\u200D✉☎📱📧📞📇🔗]"
    );

    private static final Pattern CONTACT_LABELS_PATTERN = Pattern.compile(
            "(?i)(?:Contact|Email|E-mail|Mail|Phone|Mobile|Tel|Cell)\\s*:\\s*"
    );

    /**
     * Sanitizes raw text by stripping contact labels, unicode icons, and normalizing spaces.
     */
    public static String sanitizeText(String text) {
        if (text == null) return "";
        // Strip unicode contact icons
        String sanitized = UNICODE_SYMBOLS_PATTERN.matcher(text).replaceAll(" ");
        // Strip contact labels
        sanitized = CONTACT_LABELS_PATTERN.matcher(sanitized).replaceAll(" ");
        // Normalize whitespace
        return sanitized.replaceAll("[\\t\\x0B\\f\\r]+", " ");
    }

    /**
     * Extracts email address, handling LinkedIn URL splitting & concatenated domains
     * (e.g., vijaykumarasamyvkps@gmailin/vijaykumarasamy/ -> vijaykumarasamyvkps@gmail.com).
     * Returns "Not Found" if no valid email is found.
     */
    public static String extractEmail(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return "Not Found";
        }

        String cleaned = sanitizeText(rawText);

        // a) Search raw text for @gmail, @yahoo, @outlook, @hotmail or @
        if (cleaned.contains("@")) {
            // b) If string matches pattern ([a-zA-Z0-9._%+-]+)@(gmail|yahoo|outlook|hotmail|in)[\/]?.*, split at / or in/
            Matcher concatMatcher = CONCAT_EMAIL_PATTERN.matcher(cleaned);
            if (concatMatcher.find()) {
                String prefix = concatMatcher.group(1).trim();
                String domain = concatMatcher.group(2).trim().toLowerCase();

                // If domain is "in", look if there is another match or default to gmail
                if (domain.equals("in")) {
                    domain = "gmail";
                }

                // c) If domain is @gmailin or @gmail missing .com, automatically format it to prefix@gmail.com
                if (domain.endsWith("in")) {
                    domain = domain.substring(0, domain.length() - 2);
                }

                if (!domain.contains(".")) {
                    if (domain.equals("gmail") || domain.equals("yahoo") || domain.equals("outlook") || domain.equals("hotmail")) {
                        return prefix + "@" + domain + ".com";
                    } else {
                        return prefix + "@" + domain + ".com";
                    }
                } else {
                    return prefix + "@" + domain.replaceAll("[.:;,/]+$", "");
                }
            }

            // Standard Email Regex Match fallback
            Matcher matcher = EMAIL_PATTERN.matcher(cleaned);
            if (matcher.find()) {
                String email = matcher.group().trim().replaceAll("[.:;,/]+$", "");
                if (email.toLowerCase().endsWith("gmailin")) {
                    email = email.substring(0, email.length() - 2) + ".com";
                }
                if (email.contains("@") && email.length() > 5) {
                    return email;
                }
            }

            // Spaced email fallback e.g. "dharsini jayakumar 6 @ gmail . com"
            Pattern spacedEmailPattern = Pattern.compile(
                    "([a-zA-Z0-9._%+-]+)\\s*@\\s*([a-zA-Z0-9.-]+)\\s*\\.\\s*([a-zA-Z]{2,})"
            );
            Matcher spacedMatcher = spacedEmailPattern.matcher(cleaned);
            if (spacedMatcher.find()) {
                return (spacedMatcher.group(1) + "@" + spacedMatcher.group(2) + "." + spacedMatcher.group(3))
                        .replaceAll("\\s+", "");
            }
        }

        return "Not Found";
    }

    /**
     * Extracts 10-digit Indian phone number normalized as a 10-digit string (e.g., "7598202292").
     * Supports formats like "+91 75982 02292", "75982 02292", "6374013615".
     * Returns "Not Found" if no valid phone number is present.
     */
    public static String extractPhone(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return "Not Found";
        }

        String cleaned = sanitizeText(rawText);

        // Match Indian phone pattern first: (?:(?:\+|00)91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}|[6-9]\d{9}
        Matcher indianMatcher = INDIAN_PHONE_PATTERN.matcher(cleaned);
        if (indianMatcher.find()) {
            String matched = indianMatcher.group().trim();
            String digits = matched.replaceAll("\\D", "");
            if (digits.startsWith("91") && digits.length() == 12) {
                digits = digits.substring(2);
            }
            if (digits.length() == 10 && digits.matches("[6-9]\\d{9}")) {
                return digits;
            }
        }

        // Match International phone pattern fallback
        Matcher intlMatcher = INTL_PHONE_PATTERN.matcher(cleaned);
        while (intlMatcher.find()) {
            String matched = intlMatcher.group().trim();
            String digits = matched.replaceAll("\\D", "");
            if (digits.startsWith("91") && digits.length() == 12) {
                digits = digits.substring(2);
            }
            if (digits.length() == 10 && digits.matches("[6-9]\\d{9}")) {
                return digits;
            } else if (digits.length() >= 10 && digits.length() <= 15) {
                return matched;
            }
        }

        return "Not Found";
    }

    /**
     * Extracts candidate name from top lines of resume text or filename.
     */
    public static String extractCandidateName(String text, String originalFilename) {
        if (text != null && !text.isBlank()) {
            String[] lines = text.split("\\r?\\n");
            for (String line : lines) {
                String sanitizedLine = sanitizeText(line).trim();
                if (!sanitizedLine.isEmpty() 
                        && sanitizedLine.length() >= 2 
                        && sanitizedLine.length() <= 45 
                        && !sanitizedLine.contains("@")
                        && !sanitizedLine.toLowerCase().contains("resume")
                        && !sanitizedLine.toLowerCase().contains("curriculum")
                        && !sanitizedLine.toLowerCase().contains("page")
                        && !sanitizedLine.matches(".*\\d{5,}.*")) {
                    return sanitizedLine;
                }
            }
        }
        if (originalFilename != null && originalFilename.contains(".")) {
            String cleanName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
            return cleanName.replaceAll("[_-]", " ").trim();
        }
        return "Candidate";
    }
}
