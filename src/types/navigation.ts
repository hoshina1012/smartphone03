import { Employee } from '../screens/employees/Employees';
import { Skill } from '../screens/skills/Skills';
import { Assignment } from '../screens/assignments/Assignments';
import { Task } from '../screens/tasks/tasks';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  Employees: undefined;
  EmployeeDetail: { employee: Employee };
  Skills: undefined;
  SkillDetail: { skill: Skill };
  Assignments: undefined;
  AssignmentDetail: { assignment: Assignment };
  Tasks: undefined;
  TaskDetail: { task: Task };
};
