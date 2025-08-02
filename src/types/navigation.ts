import { Employee } from '../screens/employees/Employees';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  Dashboard: undefined;
  Employees: undefined;
  EmployeeDetail: { employee: Employee };
};
