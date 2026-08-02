package com.example.demo.dto;

import java.util.List;

public class ATSEvaluationResponse {
    private int matchPercentage;
    private List<String> missingKeywords;
    private String feedback;

    public ATSEvaluationResponse() {}

    public ATSEvaluationResponse(int matchPercentage, List<String> missingKeywords, String feedback) {
        this.matchPercentage = matchPercentage;
        this.missingKeywords = missingKeywords;
        this.feedback = feedback;
    }

    public int getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(int matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public List<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(List<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
