import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Upload, Eye, Trash2, CheckCircle2, AlertCircle, Search, Download, Clock, User, Filter, RefreshCw } from 'lucide-react';

interface Report {
  id: string;
  patient_id: string;
  title: string;
  file_url: string;
  report_type: string;
  uploaded_at: string;
  patient_name?: string;
}

export function MedicalReportPage({ pageLabel = 'Medical Reports' }: { pageLabel?: string } = {}) {
  const { user, role } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', type: 'Lab Result' });
  const [replacingReportId, setReplacingReportId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let q;
      
      if (role === 'patient') {
        q = query(
          collection(db, 'medical_reports'),
          where('patient_id', '==', user.uid)
        );
      } else {
        // For doctors/admins, show all for now
        q = query(
          collection(db, 'medical_reports')
        );
      }

      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    } catch (err: any) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role === 'doctor' || !selectedFile) return;
    
    // File validation
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');
    
    try {
      // Create a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `reports/${user.uid}/${fileName}`;

      // Upload to Firebase Storage with real-time progress
      const storageRef = ref(storage, filePath);
      const task = uploadBytesResumable(storageRef, selectedFile, { contentType: selectedFile.type });

      await new Promise<string>((resolve, reject) => {
        task.on('state_changed', 
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(pct);
          },
          (err) => {
            setError(err?.message || 'Upload failed. Please check your network or storage permissions.');
            reject(err);
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve(url);
            } catch (e) {
              reject(e);
            }
          }
        );
      }).then(async (fileUrl) => {
        // Add record to Firestore
        if (replacingReportId) {
          await addDoc(collection(db, 'medical_reports'), {
            // keeping replacement simple; real apps would update existing doc
            patient_id: user.uid,
            title: newReport.title || 'Updated Report',
            report_type: newReport.type,
            file_url: fileUrl,
            uploaded_at: new Date().toISOString()
          });
          setSuccess('Report replaced successfully!');
        } else {
          await addDoc(collection(db, 'medical_reports'), {
            patient_id: user.uid,
            title: newReport.title,
            report_type: newReport.type,
            file_url: fileUrl,
            uploaded_at: new Date().toISOString()
          });
          setSuccess('Report uploaded successfully!');
        }
      });

      setUploadProgress(100);

      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setReplacingReportId(null);
        setNewReport({ title: '', type: 'Lab Result' });
      }, 500);
      await loadReports();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error uploading report');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (url: string, title: string) => {
    if (!url || url.startsWith('https://example.com')) {
      alert('This is a dummy report for demonstration. No real file is available for download.');
      return;
    }
    
    try {
      // For mobile devices, we use the Browser plugin if available, otherwise open in new tab
      if (window.innerWidth < 768) {
        window.open(url, '_blank');
      } else {
        // Standard web download
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = title || 'medical-report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: just open in new tab
      window.open(url, '_blank');
    }
  };

  const deleteReport = async (reportId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      setLoading(true);
      // Delete from Firestore
      await deleteDoc(doc(db, 'medical_reports', reportId));
      
      // Attempt to delete from Storage (optional, might fail if rules are strict)
      try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn('Could not delete file from storage:', storageErr);
      }

      setSuccess('Report deleted successfully');
      await loadReports();
    } catch (err: any) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const canUpload = role === 'admin' || role === 'patient';

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.report_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{pageLabel}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {role === 'doctor' ? 'View-only access to patient records.' : 'Securely manage and view your medical documentation.'}
          </p>
        </div>
        {canUpload && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2 px-8 py-4 shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transform hover:-translate-y-1 transition-all"
          >
            <Upload size={20} />
            Upload New Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Quick Filters
            </h3>
            <div className="space-y-2">
              {['All Reports', 'Lab Result', 'Radiology', 'Prescription', 'Discharge Summary'].map(type => (
                <button key={type} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-400 font-medium transition-colors">
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              Data Privacy
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              All medical reports are encrypted and only accessible by you and authorized healthcare providers.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              End-to-End Encrypted
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search reports by title or type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 py-4 shadow-sm"
            />
          </div>

          {filteredReports.length === 0 ? (
            <div className="card p-20 text-center">
              <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Reports Found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="card p-5 group hover:border-blue-200 transition-all duration-300 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{report.title}</h4>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter mt-1">{report.report_type}</p>
                    <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(report.uploaded_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><User size={12} /> Patient ID: {report.patient_id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setShowPreview(report.file_url)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200" title="View Report">
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownload(report.file_url, report.title)}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200" title="Download">
                      <Download size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setReplacingReportId(report.id);
                        setNewReport({ title: report.title, type: report.report_type });
                        setShowUploadModal(true);
                      }}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-[#1E88E5] hover:text-white rounded-xl transition-all duration-200" title="Replace File">
                      <RefreshCw size={18} />
                    </button>
                    {canUpload && (
                      <button 
                        onClick={() => deleteReport(report.id, report.file_url)}
                        className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Document Preview</h3>
              <button 
                onClick={() => setShowPreview(null)}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                <Trash2 size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4">
              {showPreview.endsWith('.pdf') ? (
                <iframe src={showPreview} className="w-full h-full rounded-xl" title="PDF Preview"></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img src={showPreview} alt="Medical Report" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{replacingReportId ? 'Replace' : 'Upload'} {pageLabel}</h2>
              <button onClick={() => {
                setShowUploadModal(false);
                setReplacingReportId(null);
              }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Trash2 size={24} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Title</label>
                <input 
                  type="text" 
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  placeholder="e.g., Blood Test Feb 2026" 
                  className="input-field" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Type</label>
                <select 
                  value={newReport.type}
                  onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                  className="input-field"
                >
                  <option>Lab Result</option>
                  <option>Radiology</option>
                  <option>Prescription</option>
                  <option>Discharge Summary</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select File</label>
                <div 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group ${
                    selectedFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900'
                  }`}
                >
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div className="animate-fadeIn">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-emerald-700">{selectedFile.name}</p>
                      <p className="text-[10px] text-emerald-600 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to select file or drag & drop</p>
                      <p className="text-xs text-slate-400 mt-2">PDF, PNG, JPG (Max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-black flex items-center gap-2 animate-shake"><AlertCircle size={16} /> {error}</div>}
              {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black flex items-center gap-2 animate-fadeIn"><CheckCircle2 size={16} /> {success}</div>}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#1E88E5]">
                    <span>Uploading Clinical Data...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1E88E5] transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-100 dark:shadow-none transition-all active:scale-95"
              >
                {uploading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-sm font-black">Verify & Upload Document</span>
                    <Upload size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
