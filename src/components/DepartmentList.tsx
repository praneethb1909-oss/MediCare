import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Building2, ChevronRight } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentListProps {
  onSelectDepartment: (departmentId: string) => void;
}

export function DepartmentList({ onSelectDepartment }: DepartmentListProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const q = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {departments.map((dept) => (
        <button
          key={dept.id}
          onClick={() => onSelectDepartment(dept.id)}
          className="card p-6 text-left group flex flex-col justify-between hover:border-blue-200"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Building2 size={24} />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{dept.name}</h3>
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{dept.description}</p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
            Select Department
          </div>
        </button>
      ))}
    </div>
  );
}
