package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EmployeeGoalRepository extends JpaRepository<EmployeeGoal, UUID> {

}
