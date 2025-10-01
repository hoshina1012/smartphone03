import { Employee } from '../screens/employees/Employees';
import { Skill } from '../screens/skills/Skills';
import { Assignment } from '../screens/assignments/Assignments';
import { Task } from '../screens/tasks/tasks';
import { Activity } from '../screens/activities/activities';
// import { Customer } from '../screens/customers/customers';
import { Company } from '../screens/companies/companies';

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
  Activities: undefined;
  ActivityDetail: { activity: Activity };
  Customers: undefined;
  // CustomerDetail: { customer: Customer };
  Companies: undefined;
  CompanyDetail: { company: Company };
};
