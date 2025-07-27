'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CaseForm from '@/app/components/CaseForm';
// Import the new component
import EmployeeAssignmentsManager from '@/app/components/EmployeeAssignmentsManager';
import { useAuth } from '../../../contexts/AuthContext';
// 社員ステータスの定義
type EmployeeStatus = 'ONSITE' | 'OFFICE' | 'TRAINING' | 'SEARCHING';

// --- Updated Type Definitions for Many-to-Many ---
// Represents the standalone Assignment entity
interface Assignment {
  id: number;
  name: string;
  content: string;
  difficulty: number;
  // No direct employee link here
}

// Represents the join table record (the assignment link)
interface EmployeeAssignment {
  employeeId: number;
  assignmentId: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  isCompleted: boolean;
  assignedAt: string; // ISO string
  assignment: Assignment; // Include the details of the linked Assignment
}

interface Case {
  id: number;
  companyName: string;
  description: string;
  startDate: string;
  endDate: string;
}

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
  memo: string | null;
  skills: EmployeeSkill[];
  cases: Case[];
  assignments: EmployeeAssignment[]; // Now holds EmployeeAssignment records
}

// 社員ステータスの選択肢
const STATUS_OPTIONS: EmployeeStatus[] = ['ONSITE', 'OFFICE', 'TRAINING', 'SEARCHING'];

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface EmployeeSkill {
  id: number;
  proficiency: number;
  yearsOfExp: number | null;
  certified: boolean;
  certDetails: string | null;
  lastUsed: string | null;
  skill: Skill;
}

// スキル編集用の型
interface EditingSkill {
  id: number;
  proficiency: number;
  yearsOfExp: string;
  certified: boolean;
  certDetails: string;
  lastUsed: string;
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const re_params = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<any>({});
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skillId: '',
    proficiency: 1,
    yearsOfExp: '',
    certified: false,
    certDetails: '',
    lastUsed: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<EditingSkill | null>(null);
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  // State related to AssignmentForm is removed for now
  // const [showAddAssignmentForm, setShowAddAssignmentForm] = useState(false);
  const [editingEmployeeAssignment, setEditingEmployeeAssignment] = useState<EmployeeAssignment | null>(null); // State to edit the *link* details

  const {id} = use(params);
  const { isLoggedIn, logout ,user} = useAuth();


  useEffect(() => {
    fetchEmployee();
    fetchAvailableSkills();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // id を依存配列に追加 (useCallback でラップするため)

  const fetchEmployee = useCallback(async () => { // useCallback でラップ
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${re_params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee');
      }
      const data = await response.json();
      setEmployee(data);
      setEditedEmployee({
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department,
        position: data.position,
        status: data.status,
        hireDate: new Date(data.hireDate).toISOString().split('T')[0],
        memo: data.memo || '',
      });
      setError(null);
    } catch (err) {
      console.error('!Error fetching employee:', err);
      setError('社員データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [re_params.id]); // re_params.id を依存配列に追加

  const fetchAvailableSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      const data = await response.json();
      setAvailableSkills(data);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (editMode) {
      setEditedEmployee((prev: any) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    } else if (editingSkill) { // Check for editingSkill *before* newSkill
      setEditingSkill((prev: any) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    } else { // Default to updating newSkill if not in editMode and not editing a skill
      setNewSkill((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  // No need for a separate handleEditingSkillChange, modify handleInputChange instead

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      console.log("re_params.id",re_params.id);
      const response = await fetch(`/api/employees/${re_params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedEmployee),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '社員情報の更新に失敗しました。');
      }

      setEditMode(false);
      fetchEmployee();
    } catch (err: any) {
      console.error('Error updating employee:', err);
      setFormError(err.message || '社員情報の更新中にエラーが発生しました。');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const skillData = {
        employeeId: parseInt(re_params.id),
        skillId: parseInt(newSkill.skillId),
        proficiency: parseInt(newSkill.proficiency.toString()),
        yearsOfExp: newSkill.yearsOfExp ? parseFloat(newSkill.yearsOfExp) : null,
        certified: newSkill.certified,
        certDetails: newSkill.certDetails || null,
        lastUsed: newSkill.lastUsed || null,
      };

      const response = await fetch('/api/employee-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'スキルの追加に失敗しました。');
      }

      // Reset form and fetch updated employee data
      setNewSkill({
        skillId: '',
        proficiency: 1,
        yearsOfExp: '',
        certified: false,
        certDetails: '',
        lastUsed: '',
      });
      setShowAddSkillForm(false);
      fetchEmployee();
    } catch (err: any) {
      console.error('Error adding skill:', err);
      setFormError(err.message || 'スキルの追加中にエラーが発生しました。');
    }
  };

  const handleEditSkill = (employeeSkill: EmployeeSkill) => {
    setEditingSkill({
      id: employeeSkill.id,
      proficiency: employeeSkill.proficiency,
      yearsOfExp: employeeSkill.yearsOfExp?.toString() || '',
      certified: employeeSkill.certified,
      certDetails: employeeSkill.certDetails || '',
      lastUsed: employeeSkill.lastUsed ? new Date(employeeSkill.lastUsed).toISOString().split('T')[0] : '',
    });
  };

  const handleCancelEditSkill = () => {
    setEditingSkill(null);
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;

    setFormError(null);

    try {
      const skillData = {
        proficiency: editingSkill.proficiency,
        yearsOfExp: editingSkill.yearsOfExp ? parseFloat(editingSkill.yearsOfExp) : null,
        certified: editingSkill.certified,
        certDetails: editingSkill.certDetails || null,
        lastUsed: editingSkill.lastUsed || null,
      };

      const response = await fetch(`/api/employee-skills/${editingSkill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'スキルの更新に失敗しました。');
      }

      setEditingSkill(null);
      fetchEmployee();
    } catch (err: any) {
      console.error('Error updating skill:', err);
      setFormError(err.message || 'スキルの更新中にエラーが発生しました。');
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    if (!confirm('このスキルを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/employee-skills/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }

      fetchEmployee();
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('スキルの削除中にエラーが発生しました。');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!confirm('この社員を削除してもよろしいですか？すべてのスキルデータも削除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      router.push('/employees');
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('社員の削除中にエラーが発生しました。');
    }
  };

  const handleSubmitCase = async (caseData: Omit<Case, 'id'> & { id?: number }) => {
    try {
      const response = await fetch(
        caseData.id ? `/api/cases/${caseData.id}` : '/api/cases',
        {
          method: caseData.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...caseData,
            employeeId: employee?.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(caseData.id ? '案件の更新に失敗しました。' : '案件の追加に失敗しました。');
      }

      setEditingCase(null);
      setShowAddCaseForm(false);
      fetchEmployee();
    } catch (error) {
      console.error('Error submitting case:', error);
      setFormError(editingCase ? '案件の更新中にエラーが発生しました。' : '案件の追加中にエラーが発生しました。');
    }
  };

  const handleDeleteCase = async (caseId: number) => {
    if (!confirm('この案件を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('案件の削除に失敗しました。');
      }

      fetchEmployee();
    } catch (error) {
      console.error('Error deleting case:', error);
      setFormError('案件の削除中にエラーが発生しました。');
    }
  };

  // --- Updated Assignment Handlers for Many-to-Many ---

  // Handler to Add/Assign an existing Assignment (Placeholder - needs UI)
  const handleAssignAssignmentClick = () => {
    // TODO: Implement UI to select an existing Assignment and provide dates/status
    console.log("Assign Assignment button clicked - needs implementation");
    setFormError("課題の割り当て機能は未実装です。");
    // This would eventually call POST /api/employee-assignments
  };

  // Handler to Edit the details of an EmployeeAssignment link
  const handleEditEmployeeAssignment = (empAssignment: EmployeeAssignment) => {
     // TODO: Implement a form/modal to edit startDate, endDate, isCompleted
     console.log("Editing EmployeeAssignment:", empAssignment);
     setEditingEmployeeAssignment(empAssignment); // Set state for potential editing form
     setFormError("課題割り当ての編集機能は未実装です。");
     // This would eventually call PUT /api/employee-assignments
  };

   // Handler to Delete/Unassign an EmployeeAssignment link
  const handleDeleteEmployeeAssignment = async (employeeId: number, assignmentId: number) => {
    if (!confirm('この社員からこの課題の割り当てを解除してもよろしいですか？')) {
      return;
    }
    setFormError(null);
    try {
      const response = await fetch(`/api/employee-assignments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, assignmentId }), // Send IDs in body
      });

      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.error || '課題の割り当て解除に失敗しました。');
      }

      fetchEmployee(); // Refresh employee data
    } catch (error: any) {
      console.error('Error deleting employee assignment:', error);
      setFormError(error.message || '課題の割り当て解除中にエラーが発生しました。');
    }
  };


  // Filter out skills that the employee already has
  const filteredAvailableSkills = availableSkills.filter(
    (skill) => !employee?.skills.some((es) => es.skill.id === skill.id)
  );

  if (loading && !employee) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
        <Link href="/dashboard/employees" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
          社員一覧に戻る
        </Link>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">社員が見つかりませんでした。</p>
        <Link href="/dashboard/employees" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
          社員一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/dashboard/employees" className="text-indigo-600 hover:text-indigo-900 text-sm">
            ← 社員一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {employee.lastName} {employee.firstName}
          </h1>
        </div>
        <div className="flex space-x-2">

          { (!editMode && user?.role == "ADMIN") && (
            <button
              onClick={() => setEditMode(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
            >
              編集
            </button>
          )}
          {user?.role == "ADMIN" && (
          <button
            onClick={handleDeleteEmployee}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
          >
            削除
          </button>
          )}
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{formError}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {editMode ? (
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">社員情報を編集</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  社員ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={editedEmployee.employeeId}
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
                  value={editedEmployee.email}
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
                  value={editedEmployee.lastName}
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
                  value={editedEmployee.firstName}
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
                  value={editedEmployee.department}
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
                  value={editedEmployee.position}
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
                  value={editedEmployee.status}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {STATUS_OPTIONS.map((status, index) => {
                    let displayText:string = ""

                    // ステータス値に応じて日本語表示テキストを設定
                    if (status === "ONSITE") {
                      displayText = "現場";
                    } else if (status === "OFFICE") {
                      displayText = "内勤";
                    } else if (status === "TRAINING") {
                      displayText = "研修中";
                    } else if (status === "SEARCHING") {
                      displayText = "現場探し中";
                    }

                    return (
                      <option key={index} value={status}>{displayText}</option>
                    );
                  })}
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
                  value={editedEmployee.hireDate}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-gray-700">
                メモ
              </label>
              <textarea
                id="memo"
                name="memo"
                value={editedEmployee.memo}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
              >
                保存
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">社員情報</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">社員ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.employeeId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">名前</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employee.lastName} {employee.firstName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">部署</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.department}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">役職</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.position}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.status === 'ONSITE' ? 'bg-green-100 text-green-800' :
                      employee.status === 'OFFICE' ? 'bg-blue-100 text-blue-800' :
                      employee.status === 'TRAINING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(() => {
                        let statusText = "";

                        // employee.statusの値に応じて日本語表示テキストを設定
                        if (employee.status === "ONSITE") {
                          statusText = "現場";
                        } else if (employee.status === "OFFICE") {
                          statusText = "内勤";
                        } else if (employee.status === "TRAINING") {
                          statusText = "研修中";
                        } else if (employee.status === "SEARCHING") {
                          statusText = "現場探し中";
                        } else {
                          // その他のステータスの場合は元の値を表示
                          statusText = employee.status;
                        }

                        return statusText;
                      })()}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">入社日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(employee.hireDate).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">メモ</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {employee.memo || '（メモはありません）'}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">スキル</h2>
                {user?.role == "ADMIN" &&
                (<button
                  onClick={() => setShowAddSkillForm(!showAddSkillForm)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded text-sm"
                >
                  {showAddSkillForm ? 'キャンセル' : 'スキルを追加'}
                </button>)}
              </div>

              {showAddSkillForm && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">新しいスキルを追加</h3>
                  <form onSubmit={handleAddSkill} className="space-y-3">
                    <div>
                      <label htmlFor="skillId" className="block text-sm font-medium text-gray-700">
                        スキル
                      </label>
                      <select
                        id="skillId"
                        name="skillId"
                        value={newSkill.skillId}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">選択してください</option>
                        {filteredAvailableSkills.map((skill) => (
                          <option key={skill.id} value={skill.id}>
                            {skill.name} ({skill.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700">
                        習熟度 (1-5)
                      </label>
                      <select
                        id="proficiency"
                        name="proficiency"
                        value={newSkill.proficiency}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value={1}>1 - 初心者</option>
                        <option value={2}>2 - 基礎知識あり</option>
                        <option value={3}>3 - 中級者</option>
                        <option value={4}>4 - 上級者</option>
                        <option value={5}>5 - エキスパート</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="yearsOfExp" className="block text-sm font-medium text-gray-700">
                        経験年数
                      </label>
                      <input
                        type="number"
                        id="yearsOfExp"
                        name="yearsOfExp"
                        value={newSkill.yearsOfExp}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="certified"
                        name="certified"
                        checked={newSkill.certified}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="certified" className="ml-2 block text-sm text-gray-700">
                        資格あり
                      </label>
                    </div>
                    {newSkill.certified && (
                      <div>
                        <label htmlFor="certDetails" className="block text-sm font-medium text-gray-700">
                          資格詳細
                        </label>
                        <input
                          type="text"
                          id="certDetails"
                          name="certDetails"
                          value={newSkill.certDetails}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor="lastUsed" className="block text-sm font-medium text-gray-700">
                        最終使用日
                      </label>
                      <input
                        type="date"
                        id="lastUsed"
                        name="lastUsed"
                        value={newSkill.lastUsed}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
                      >
                        追加
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {employee.skills.length > 0 ? (
                <div className="space-y-4">
                  {employee.skills.map((skill) => (
                    <div key={skill.id} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{skill.skill.name}</h4>
                          <p className="text-sm text-gray-500">{skill.skill.category}</p>
                        </div>
                        <div className="space-x-2">
                          {user?.role == "ADMIN" && (
                          <button
                            onClick={() => handleEditSkill(skill)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            編集
                          </button>)
      }
                          {user?.role == "ADMIN" && (
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            削除
                          </button>)
                          }
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">習熟度: {skill.proficiency}</p>
                        {skill.yearsOfExp && (
                          <p className="text-sm">経験年数: {skill.yearsOfExp}年</p>
                        )}
                        {skill.certified && (
                          <p className="text-sm">
                            資格: {skill.certDetails || 'あり'}
                          </p>
                        )}
                        {skill.lastUsed && (
                          <p className="text-sm">
                            最終使用日: {new Date(skill.lastUsed).toLocaleDateString('ja-JP')}
                          </p>
                        )}
                      </div>

                      {/* スキル編集フォーム */}
                      {editingSkill && editingSkill.id === skill.id && (
                        <form onSubmit={handleUpdateSkill} className="mt-4 space-y-3 bg-white p-4 border border-gray-200 rounded-md">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">スキルを編集</h5>
                          <div>
                            <label htmlFor={`proficiency-${skill.id}`} className="block text-xs font-medium text-gray-600">
                              習熟度 (1-5)
                            </label>
                            <select
                              id={`proficiency-${skill.id}`}
                              name="proficiency"
                              value={editingSkill.proficiency}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value={1}>1 - 初心者</option>
                              <option value={2}>2 - 基礎知識あり</option>
                              <option value={3}>3 - 中級者</option>
                              <option value={4}>4 - 上級者</option>
                              <option value={5}>5 - エキスパート</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`yearsOfExp-${skill.id}`} className="block text-xs font-medium text-gray-600">
                              経験年数
                            </label>
                            <input
                              type="number"
                              id={`yearsOfExp-${skill.id}`}
                              name="yearsOfExp"
                              value={editingSkill.yearsOfExp}
                              onChange={handleInputChange}
                              step="0.1"
                              min="0"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`certified-${skill.id}`}
                              name="certified"
                              checked={editingSkill.certified}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`certified-${skill.id}`} className="ml-2 block text-sm text-gray-700">
                              資格あり
                            </label>
                          </div>
                          {editingSkill.certified && (
                            <div>
                              <label htmlFor={`certDetails-${skill.id}`} className="block text-xs font-medium text-gray-600">
                                資格詳細
                              </label>
                              <input
                                type="text"
                                id={`certDetails-${skill.id}`}
                                name="certDetails"
                                value={editingSkill.certDetails}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          )}
                          <div>
                            <label htmlFor={`lastUsed-${skill.id}`} className="block text-xs font-medium text-gray-600">
                              最終使用日
                            </label>
                            <input
                              type="date"
                              id={`lastUsed-${skill.id}`}
                              name="lastUsed"
                              value={editingSkill.lastUsed}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={handleCancelEditSkill}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded text-sm"
                            >
                              キャンセル
                            </button>
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded text-sm"
                            >
                              保存
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">スキルが登録されていません</p>
              )}
            </div>

            {/* 案件セクション */}
            <div className="col-span-2 mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">案件履歴</h2>
                {user?.role == "ADMIN" &&(
                <button
                  onClick={() => {
                    setEditingCase(null); // 編集中の案件があればリセット
                    setShowAddCaseForm(!showAddCaseForm);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1 px-3 rounded text-sm"
                >
                  {showAddCaseForm && !editingCase ? 'キャンセル' : '案件を追加'}
                </button>
          ) }
              </div>

              {(showAddCaseForm || editingCase) && (
                <CaseForm
                  initialCase={editingCase || undefined}
                  onSubmit={handleSubmitCase}
                  onCancel={() => {
                    setShowAddCaseForm(false);
                    setEditingCase(null);
                  }}
                  isEditing={!!editingCase}
                />
              )}

              {employee.cases && employee.cases.length > 0 ? (
                <div className="space-y-4">
                  {employee.cases
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) // 開始日で降順ソート
                    .map((case_) => (
                    <div key={case_.id} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{case_.companyName}</h4>
                          <p className="text-sm text-gray-600">{case_.description}</p>
                        </div>
                        <div className="space-x-2">
                          <Link href={`/dashboard/cases/${case_.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm">詳細</Link>
                          {user?.role == "ADMIN" && (
                          <button
                            onClick={() => {
                              setEditingCase(case_);
                              setShowAddCaseForm(false); // 追加フォームは閉じる
                            }}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            編集
                          </button>
                          )}
                          {user?.role == "ADMIN" && (
                          <button
                            onClick={() => handleDeleteCase(case_.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            削除
                          </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {new Date(case_.startDate).toLocaleDateString('ja-JP')} ～{' '}
                        {new Date(case_.endDate).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">案件履歴がありません</p>
              )}
            </div>

            {/* --- 課題セクション --- */}
            {/* Replace the old assignment section with the new component */}
            <div className="col-span-2">
              <EmployeeAssignmentsManager employeeId={employee.id} />
            </div>
            {/* --- 課題セクションここまで --- */}
          </div>
        )}
      </div>
    </div>
  );
}
