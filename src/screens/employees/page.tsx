'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';


type EmployeeStatus = 'ONSITE' | 'OFFICE' | 'TRAINING' | 'SEARCHING';

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  hireDate: string;
  skills: any[];
}

interface SearchFilters {
  employeeId: string;
  name: string;
  department: string;
  position: string;
  status: string;
  skillName: string;
  hireDateFrom: string;
  hireDateTo: string;
}

// 並び替えの対象となるカラム
type SortColumn = 'employeeId' | 'name' | 'department' | 'position' | 'status' | 'hireDate' | 'skillCount';

// 並び替えの方向
type SortDirection = 'asc' | 'desc';

// 社員ステータスの選択肢
const STATUS_OPTIONS: EmployeeStatus[] = ['ONSITE', 'OFFICE', 'TRAINING', 'SEARCHING'];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    employeeId: '',
    name: '',
    department: '',
    position: '',
    status: '',
    skillName: '',
    hireDateFrom: '',
    hireDateTo: '',
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>('employeeId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    status: 'OFFICE' as EmployeeStatus,
    hireDate: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  const { isLoggedIn, logout ,user} = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 検索条件または並び替え条件が変更されたときにフィルタリングを実行
  useEffect(() => {
    filterEmployees();
  }, [searchFilters, employees, sortColumn, sortDirection]);

  // 部署と役職の一覧を取得
  useEffect(() => {
    if (employees.length > 0) {
      const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department)));
      const uniquePositions = Array.from(new Set(employees.map(emp => emp.position)));
      const uniqueStatuses = Array.from(new Set(employees.map(emp => emp.status)));
      setDepartments(uniqueDepartments);
      setPositions(uniquePositions);
      setStatuses(uniqueStatuses);
    }
  }, [employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('社員データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // 検索条件に基づいて社員をフィルタリングし、並び替える
  const filterEmployees = () => {
    if (!employees.length) return;

    let filtered = [...employees];

    // 社員IDでフィルタリング
    if (searchFilters.employeeId) {
      filtered = filtered.filter(emp =>
        emp.employeeId.toLowerCase().includes(searchFilters.employeeId.toLowerCase())
      );
    }

    // 名前でフィルタリング
    if (searchFilters.name) {
      const nameSearch = searchFilters.name.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName.toLowerCase().includes(nameSearch) ||
        emp.lastName.toLowerCase().includes(nameSearch) ||
        `${emp.lastName} ${emp.firstName}`.toLowerCase().includes(nameSearch)
      );
    }

    // 部署でフィルタリング
    if (searchFilters.department) {
      filtered = filtered.filter(emp => emp.department === searchFilters.department);
    }

    // 役職でフィルタリング
    if (searchFilters.position) {
      filtered = filtered.filter(emp => emp.position === searchFilters.position);
    }

    // ステータスでフィルタリング
    if (searchFilters.status) {
      filtered = filtered.filter(emp => emp.status === searchFilters.status);
    }

    // スキル名でフィルタリング
    if (searchFilters.skillName) {
      const skillSearch = searchFilters.skillName.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.skills.some(skillObj =>
          skillObj.skill.name.toLowerCase().includes(skillSearch)
        )
      );
    }

    // 入社日（開始日）でフィルタリング
    if (searchFilters.hireDateFrom) {
      const fromDate = new Date(searchFilters.hireDateFrom);
      filtered = filtered.filter(emp => {
        const empDate = new Date(emp.hireDate);
        return empDate >= fromDate;
      });
    }

    // 入社日（終了日）でフィルタリング
    if (searchFilters.hireDateTo) {
      const toDate = new Date(searchFilters.hireDateTo);
      // 終了日の23:59:59まで含めるために日付を調整
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(emp => {
        const empDate = new Date(emp.hireDate);
        return empDate <= toDate;
      });
    }

    // 並び替え
    filtered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortColumn) {
        case 'employeeId':
          valueA = a.employeeId;
          valueB = b.employeeId;
          break;
        case 'name':
          valueA = `${a.lastName} ${a.firstName}`;
          valueB = `${b.lastName} ${b.firstName}`;
          break;
        case 'department':
          valueA = a.department;
          valueB = b.department;
          break;
        case 'position':
          valueA = a.position;
          valueB = b.position;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'hireDate':
          valueA = new Date(a.hireDate).getTime();
          valueB = new Date(b.hireDate).getTime();
          break;
        case 'skillCount':
          valueA = a.skills?.length || 0;
          valueB = b.skills?.length || 0;
          break;
        default:
          valueA = a.employeeId;
          valueB = b.employeeId;
      }

      // 文字列の場合は大文字小文字を区別せずに比較
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
  };

  // 並び替えの処理
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // 同じカラムがクリックされた場合は並び替えの方向を反転
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 異なるカラムがクリックされた場合は、そのカラムで昇順に並び替え
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 並び替えの状態を表示するアイコン
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;

    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // 検索フォームの入力変更ハンドラ
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 検索条件をリセット
  const resetSearch = () => {
    setSearchFilters({
      employeeId: '',
      name: '',
      department: '',
      position: '',
      status: '',
      skillName: '',
      hireDateFrom: '',
      hireDateTo: '',
    });
    setFilteredEmployees(employees);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '社員の追加に失敗しました。');
      }

      // Reset form and fetch updated list
      setNewEmployee({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        position: '',
        status: 'OFFICE',
        hireDate: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
      fetchEmployees();
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setFormError(err.message || '社員の追加中にエラーが発生しました。');
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">社員一覧</h1>
        <div className="space-x-2">
          <button
            onClick={() => {
              setShowSearchForm(!showSearchForm);
              if (showAddForm) setShowAddForm(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            {showSearchForm ? '検索を閉じる' : '検索'}
          </button>

          {user?.role == "ADMIN" && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (showSearchForm) setShowSearchForm(false);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
          >
            {showAddForm ? 'キャンセル' : '社員を追加'}
          </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 検索フォーム */}
      {showSearchForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">社員検索</h2>
            <button
              onClick={resetSearch}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              検索条件をリセット
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                社員ID
              </label>
              <input
                type="text"
                id="employeeId"
                name="employeeId"
                value={searchFilters.employeeId}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={searchFilters.name}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                部署
              </label>
              <select
                id="department"
                name="department"
                value={searchFilters.department}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">すべて</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                役職
              </label>
              <select
                id="position"
                name="position"
                value={searchFilters.position}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">すべて</option>
                {positions.map((pos, index) => (
                  <option key={index} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                value={searchFilters.status}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">すべて</option>
                <option value="ONSITE">現場</option>
                <option value="OFFICE">内勤</option>
                <option value="TRAINING">研修中</option>
                <option value="SEARCHING">現場探し中</option>
              </select>
            </div>
            <div>
              <label htmlFor="skillName" className="block text-sm font-medium text-gray-700">
                スキル名
              </label>
              <input
                type="text"
                id="skillName"
                name="skillName"
                value={searchFilters.skillName}
                onChange={handleSearchChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hireDateFrom" className="block text-sm font-medium text-gray-700">
                  入社日（開始）
                </label>
                <input
                  type="date"
                  id="hireDateFrom"
                  name="hireDateFrom"
                  value={searchFilters.hireDateFrom}
                  onChange={handleSearchChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="hireDateTo" className="block text-sm font-medium text-gray-700">
                  入社日（終了）
                </label>
                <input
                  type="date"
                  id="hireDateTo"
                  name="hireDateTo"
                  value={searchFilters.hireDateTo}
                  onChange={handleSearchChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              検索結果: {filteredEmployees.length} 件
            </p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">新しい社員を追加</h2>
          {formError && (
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-red-700">{formError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  社員ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={newEmployee.employeeId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newEmployee.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  姓
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={newEmployee.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  名
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={newEmployee.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  部署
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={newEmployee.department}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  役職
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={newEmployee.position}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  ステータス
                </label>
                <select
                  id="status"
                  name="status"
                  value={newEmployee.status}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ><option value="ONSITE">現場</option>
                <option value="OFFICE">内勤</option>
                <option value="TRAINING">研修中</option>
                <option value="SEARCHING">現場探し中</option>

                </select>
              </div>
              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">
                  入社日
                </label>
                <input
                  type="date"
                  id="hireDate"
                  name="hireDate"
                  value={newEmployee.hireDate}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredEmployees.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employeeId')}
                >
                  社員ID {renderSortIcon('employeeId')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  名前 {renderSortIcon('name')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('department')}
                >
                  部署 {renderSortIcon('department')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('position')}
                >
                  役職 {renderSortIcon('position')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  ステータス {renderSortIcon('status')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('hireDate')}
                >
                  入社日 {renderSortIcon('hireDate')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('skillCount')}
                >
                  スキル数 {renderSortIcon('skillCount')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.lastName} {employee.firstName}
                    </div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'ONSITE' ? 'bg-green-100 text-green-800' :
                      employee.status === 'OFFICE' ? 'bg-blue-100 text-blue-800' :
                      employee.status === 'TRAINING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(() => {
  let statusText = "";
  console.log(employee.status);
  // employee.statusの値に応じて日本語表示テキストを設定
  if (employee.status == "ONSITE") {

    statusText = "現場";
  } else if (employee.status == "OFFICE") {
    statusText = "内勤";
  } else if (employee.status == "TRAINING") {
    statusText = "研修中";
  } else if (employee.status == "SEARCHING") {
    statusText = "現場探し中";
  } else {
    // その他のステータスの場合は元の値を表示
    statusText = employee.status;
  }

  return statusText;
})()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.hireDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {employee.skills?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/employees/${employee.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">社員データがありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
