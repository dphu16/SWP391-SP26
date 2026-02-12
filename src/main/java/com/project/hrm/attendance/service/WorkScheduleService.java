package com.project.hrm.attendance.service;

import com.project.hrm.attendance.dto.ShiftResponse;
import com.project.hrm.attendance.dto.WorkScheduleResponse;
import com.project.hrm.attendance.entity.WorkSchedule;
import com.project.hrm.attendance.repository.WorkScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WorkScheduleService {

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    public List<WorkScheduleResponse> getAllSchedules() {
        List<WorkSchedule> entities = workScheduleRepository.findAll();
        List<WorkScheduleResponse> dtos = new ArrayList<>();

        for (WorkSchedule entity : entities) {
            WorkScheduleResponse dto = new WorkScheduleResponse();


            dto.setId(entity.getScheduleId());

            dto.setDate(entity.getDate());

            if (entity.getShift() != null) {
                ShiftResponse shiftDto = new ShiftResponse();

                shiftDto.setId(entity.getShift().getShiftId());

                shiftDto.setName(entity.getShift().getShiftName());
                shiftDto.setStartTime(entity.getShift().getStartTime());
                shiftDto.setEndTime(entity.getShift().getEndTime());

                dto.setShift(shiftDto);
            }
            dtos.add(dto);
        }
        return dtos;
    }
}