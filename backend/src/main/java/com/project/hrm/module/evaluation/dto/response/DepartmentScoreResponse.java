package com.project.hrm.module.evaluation.dto.response;

public class DepartmentScoreResponse {
    private String departmentName;
    private double averageScore;

    public DepartmentScoreResponse(String departmentName, double averageScore) {
        this.departmentName = departmentName;
        this.averageScore = averageScore;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(double averageScore) {
        this.averageScore = averageScore;
    }
}
