package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;
    private String candidateName;
    private String email;
    private String phone;
    private String skills;
    private String experience;
    private String content;
    private String status = "Pending";
    private int atsScore = 0;
    private java.util.List<String> matchedSkills = new java.util.ArrayList<>();
    private java.util.List<String> missingSkills = new java.util.ArrayList<>();
    private String feedback;
    private LocalDateTime uploadedAt;

    public Resume() {
        this.uploadedAt = LocalDateTime.now();
        this.status = "Pending";
    }

    public Resume(String id, String candidateName, String email, String phone, String skills, String experience, String content) {
        this.id = id;
        this.candidateName = candidateName;
        this.email = email;
        this.phone = phone;
        this.skills = skills;
        this.experience = experience;
        this.content = content;
        this.uploadedAt = LocalDateTime.now();
        this.status = "Pending";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getAtsScore() {
        return atsScore;
    }

    public void setAtsScore(int atsScore) {
        this.atsScore = atsScore;
    }

    public java.util.List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(java.util.List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public java.util.List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(java.util.List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
