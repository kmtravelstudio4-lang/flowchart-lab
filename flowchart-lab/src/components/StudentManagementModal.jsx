import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit3, Trash2, Search, Upload, 
  Check, X, AlertCircle, ChevronDown, Download, FileSpreadsheet, FileDown
} from 'lucide-react';
import { logActivity } from '../utils/auditLogger';
import { subscribeStudents, saveStudent as saveStudentFirestore } from '../services/firestoreService';

const STORAGE_ROSTER_KEY = 'flowchart_student_roster';

export default function StudentManagementModal({ onClose, onSelectStudentProfile }) {
  const [roster, setRoster] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROSTER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Subscribe to real-time students from Firestore
  useEffect(() => {
    const unsubscribe = subscribeStudents((cloudStudents) => {
      if (Array.isArray(cloudStudents) && cloudStudents.length > 0) {
        setRoster(prev => {
          const combined = [...cloudStudents];
          if (Array.isArray(prev)) {
            prev.forEach(p => {
              if (!combined.some(c => c.studentId === p.studentId || (c.name === p.name && c.room === p.room))) {
                combined.push(p);
              }
            });
          }
          try {
            localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);


  // Handle Download CSV Template
  const handleDownloadCSVTemplate = () => {
    const csvContent = "\uFEFFชื่อ-นามสกุล,ห้อง,เลขที่\nด.ช. สมชาย ใจดี,ป.6/1,1\nด.ญ. สมหญิง รักเรียน,ป.6/1,2\nด.ช. กิตติศักดิ์ มุ่งมั่น,ป.6/2,1";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Export Current Roster as CSV
  const handleExportRosterCSV = () => {
    if (roster.length === 0) {
      alert('ยังไม่มีข้อมูลนักเรียนในระบบ');
      return;
    }
    let csvContent = "\uFEFFStudent ID,ชื่อ-นามสกุล,ห้อง,เลขที่,สถานะ\n";
    roster.forEach(s => {
      csvContent += `"${s.studentId}","${s.name}","${s.room}","${s.number}","${s.status || 'ACTIVE'}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Save Student (Add / Edit)
  const handleSaveStudent = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อ-นามสกุลนักเรียน');
      return;
    }
    if (!formData.room) {
      setFormError('กรุณาเลือกห้องเรียน');
      return;
    }
    if (!formData.number.trim()) {
      setFormError('กรุณากรอกเลขที่');
      return;
    }

    // Check duplicate number in the same room
    const isDuplicate = roster.some(s => 
      s.room === formData.room && 
      s.number === formData.number.trim() && 
      (!editingStudent || s.studentId !== editingStudent.studentId)
    );

    if (isDuplicate) {
      setFormError(`เลขที่ ${formData.number} ในห้อง ${formData.room} มีอยู่ในระบบแล้ว`);
      return;
    }

    if (isAddingNew) {
      const newStudent = {
        studentId: formData.studentId.trim() || `STD_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
        name: formData.name.trim(),
        room: formData.room,
        number: formData.number.trim(),
        status: formData.status || 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setRoster(prev => [newStudent, ...prev]);
      saveStudentFirestore(newStudent).catch(() => {});
      logActivity({
        action: 'ADD_STUDENT',
        target: `${newStudent.name} (${newStudent.room})`,
        result: 'SUCCESS'
      });
    } else if (editingStudent) {
      const updated = {
        ...editingStudent,
        name: formData.name.trim(),
        room: formData.room,
        number: formData.number.trim(),
        status: formData.status,
        updatedAt: new Date().toISOString()
      };
      setRoster(prev => prev.map(s => s.studentId === editingStudent.studentId ? updated : s));
      saveStudentFirestore(updated).catch(() => {});

      logActivity({
        action: 'EDIT_STUDENT',
        target: `${formData.name} (${formData.room})`,
        result: 'SUCCESS'
      });
    }

    setIsAddingNew(false);
    setEditingStudent(null);
    setFormData({ studentId: '', name: '', room: 'ป.6/1', number: '', status: 'ACTIVE' });
  };

  // Handle Delete Student
  const handleDeleteStudent = (student) => {
    if (window.confirm(`คุณต้องการลบนักเรียน "${student.name}" (ห้อง ${student.room} เลขที่ ${student.number}) ออกจากทะเบียนใช่หรือไม่?`)) {
      setRoster(prev => prev.filter(s => s.studentId !== student.studentId));
      logActivity({
        action: 'DELETE_STUDENT',
        target: `${student.name} (${student.room})`,
        result: 'SUCCESS'
      });
    }
  };

  // Handle CSV Import
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          alert('ไฟล์ CSV ไม่มีข้อมูลนักเรียน');
          return;
        }

        // Expected CSV format: ชื่อ,ห้อง,เลขที่
        let importedCount = 0;
        const newStudents = [];

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            const [name, room, number] = parts;
            if (name && room && number) {
              const stdObj = {
                studentId: `STD_${Date.now()}_${i}`,
                name,
                room,
                number,
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              newStudents.push(stdObj);
              saveStudentFirestore(stdObj).catch(() => {});
              importedCount++;
            }
          }
        }


        if (newStudents.length > 0) {
          setRoster(prev => [...newStudents, ...prev]);
          logActivity({
            action: 'IMPORT_STUDENTS_CSV',
            target: `${importedCount} นักเรียน`,
            result: 'SUCCESS'
          });
          alert(`✅ นำเข้ารายชื่อนักเรียนสำเร็จทั้งหมด ${importedCount} คน`);
        }
      } catch (err) {
        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ${err.message}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Filtered Roster
  const filteredRoster = roster.filter(s => {
    const matchRoom = roomFilter === 'ALL' || s.room === roomFilter;
    const matchQuery = !searchQuery.trim() || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.number.includes(searchQuery) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRoom && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                ระบบจัดการทะเบียนนักเรียน (Student Roster Management)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ดาวน์โหลดแม่แบบ CSV นำเข้ารายชื่อ และส่งออกไฟล์ทะเบียนนักเรียน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search and Room Filter */}
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เลขที่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="relative">
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">ทุกห้อง ({roster.length})</option>
                <option value="ป.6/1">ห้อง ป.6/1</option>
                <option value="ป.6/2">ห้อง ป.6/2</option>
                <option value="ป.6/3">ห้อง ป.6/3</option>
                <option value="ป.6/4">ห้อง ป.6/4</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCSVTemplate}
              title="ดาวน์โหลดไฟล์แม่แบบ CSV สำหรับพิมพ์ชื่อเด็ก"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3 py-2 rounded-2xl text-xs transition border border-emerald-200 flex items-center space-x-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>ดาวน์โหลดแม่แบบ CSV</span>
            </button>

            <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3 py-2 rounded-2xl text-xs transition border border-indigo-200 flex items-center space-x-1.5 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้า CSV</span>
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>

            {roster.length > 0 && (
              <button
                type="button"
                onClick={handleExportRosterCSV}
                title="ส่งออกรายชื่อนักเรียนทั้งหมดเป็น CSV"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-3 py-2 rounded-2xl text-xs transition border border-slate-200 flex items-center space-x-1.5 shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-600" />
                <span>ส่งออก CSV ({roster.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingStudent(null);
                setFormData({ studentId: '', name: '', room: 'ป.6/1', number: '', status: 'ACTIVE' });
                setFormError('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-2xl text-xs transition shadow-md flex items-center space-x-1.5 action-btn-hover"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มนักเรียน</span>
            </button>
          </div>
        </div>

        {/* Add / Edit Form Modal Sub-panel */}
        {(isAddingNew || editingStudent) && (
          <form onSubmit={handleSaveStudent} className="p-4 sm:p-5 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-blue-950 flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{isAddingNew ? 'เพิ่มนักเรียนใหม่' : `แก้ไขข้อมูล: ${editingStudent.name}`}</span>
              </h4>
              <button
                type="button"
                onClick={() => { setIsAddingNew(false); setEditingStudent(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อ-นามสกุลนักเรียน</label>
                <input
                  type="text"
                  placeholder="เช่น เด็กชายกิตติศักดิ์ เรียนดี"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ห้องเรียน</label>
                <select
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ป.6/1">ห้อง ป.6/1</option>
                  <option value="ป.6/2">ห้อง ป.6/2</option>
                  <option value="ป.6/3">ห้อง ป.6/3</option>
                  <option value="ป.6/4">ห้อง ป.6/4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">เลขที่</label>
                <input
                  type="number"
                  placeholder="เช่น 1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsAddingNew(false); setEditingStudent(null); }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-600 font-bold text-xs border border-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกข้อมูล</span>
              </button>
            </div>
          </form>
        )}

        {/* Student Table */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 pl-4">เลขที่</th>
                <th className="p-3">ชื่อ-นามสกุล</th>
                <th className="p-3">ห้องเรียน</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right pr-4">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    ยังไม่มีข้อมูลนักเรียนในห้องนี้ (กดปุ่ม "เพิ่มนักเรียน" หรือ "นำเข้า CSV" เพื่อเริ่มต้น)
                  </td>
                </tr>
              ) : (
                filteredRoster.map((student) => (
                  <tr key={student.studentId} className="hover:bg-blue-50/40 transition">
                    <td className="p-3 pl-4 font-mono font-black text-slate-700">{student.number}</td>
                    <td className="p-3 font-bold text-slate-900">{student.name}</td>
                    <td className="p-3 font-medium text-slate-600">{student.room}</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        พร้อมเข้าเรียน
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setIsAddingNew(false);
                          setFormData({
                            studentId: student.studentId,
                            name: student.name,
                            room: student.room,
                            number: student.number,
                            status: student.status
                          });
                          setFormError('');
                        }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                        title="ลบนักเรียน"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>รวมนักเรียนในทะเบียนทั้งหมด: <strong>{roster.length}</strong> คน</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-md"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
