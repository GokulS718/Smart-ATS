package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "evaluations")
public class Evaluation {

    @Id
    private String id;
    private int matchPercentage;
    private List<String> missingKeywords;
    private String feedback;
    private LocalDateTime evaluatedAt;

    public Evaluation() {
        this.evaluatedAt = LocalDateTime.now();
    }

    public Evaluation(int matchPercentage, List<String> missingKeywords, String feedback) {
        this.matchPercentage = matchPercentage;
        this.missingKeywords = missingKeywords;
        this.feedback = feedback;
        this.evaluatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public LocalDateTime getEvaluatedAt() {
        return evaluatedAt;
    }

    public void setEvaluatedAt(LocalDateTime evaluatedAt) {
        this.evaluatedAt = evaluatedAt;
    }
}
