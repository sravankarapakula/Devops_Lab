package com.example.student;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StudentServiceTest {

    @Test
    void shouldAddStudentSuccessfully() {
        StudentService studentService = new StudentService();

        Student student = new Student(1, "Akash", "CSE");

        Student result = studentService.addStudent(student);

        assertNotNull(result);
        assertEquals(1, studentService.getAllStudents().size());
        assertEquals("Akash", result.getName());
        assertEquals("CSE", result.getDepartment());
    }
}