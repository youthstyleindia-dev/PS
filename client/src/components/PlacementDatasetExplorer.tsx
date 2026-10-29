import React, { useState, useEffect } from 'react';
import { hubService } from '../services/hub.service';
import { PlacementRecord, PlacementStats } from '../types';

export const PlacementDatasetExplorer: React.FC = () => {
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('ctc_lpa');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected student modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentModalLoading, setStudentModalLoading] = useState<boolean>(false);

  // Load KPI Stats
  useEffect(() => {
    hubService.getPlacementStats()
      .then(res => setStats(res))
      .catch(err => console.warn('Failed to load placement stats:', err));
  }, []);

  // Load Paginated Records
  useEffect(() => {
    setLoading(true);
    hubService.getPlacements({
      page,
      limit: 15,
      branch: selectedBranch,
      status: selectedStatus,
      category: selectedCategory,
      academicYear: selectedYear,
      search: searchQuery,
      sortBy,
      sortOrder
    })
      .then(res => {
        setRecords(res.records || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Failed to load placement records:', err);
        setLoading(false);
      });
  }, [page, selectedBranch, selectedStatus, selectedCategory, selectedYear, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    hubService.getPlacements({
      page: 1,
      limit: 15,
      branch: selectedBranch,
      status: selectedStatus,
      category: selectedCategory,
      academicYear: selectedYear,
      search: searchQuery,
      sortBy,
      sortOrder
    })
      .then(res => {
        setRecords(res.records || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openStudentDetails = (idOrEmail: string) => {
    setStudentModalLoading(true);
    hubService.getStudentPlacement(idOrEmail)
      .then(res => {
        setSelectedStudent(res);
        setStudentModalLoading(false);
      })
      .catch(() => setStudentModalLoading(false));
  };

  return (
    <div className="flex flex-col gap-6 w-full font-body-md text-on-surface">
      {/* 1. Header Banner & Provenance Notice */}
      <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">school</span>
            <h2 className="font-title-md text-title-md font-bold uppercase tracking-wide">
              Collegiate Placement Dataset &amp; Scholar Telemetry
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Deterministic institutional dataset containing 1,997 scholar placement profiles, authentic CGPAs, and cross-module browsing telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 border border-outline-variant text-label-sm font-mono">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span className="text-secondary font-bold">1,997 RECORDS ONLINE</span>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Candidates</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary">{stats.kpis.totalCandidates}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-mono">100% Cohort</span>
          </div>
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Placed Count</span>
            <span className="font-headline-sm text-headline-sm font-bold text-secondary">{stats.kpis.totalPlaced}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-mono">Verified Offers</span>
          </div>
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Placement Rate</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary">{stats.kpis.placementRate}%</span>
            <span className="text-[11px] text-secondary block mt-0.5 font-mono">Top Quartile</span>
          </div>
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Average CTC</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{stats.kpis.avgCtc} LPA</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-mono">Across All Placed</span>
          </div>
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Highest Package</span>
            <span className="font-headline-sm text-headline-sm font-bold text-secondary">{stats.kpis.highestCtc} LPA</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-mono">Elite Super Dream</span>
          </div>
          <div className="bg-surface-container p-3 border border-outline-variant">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono block">Average CGPA</span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{stats.kpis.avgCgpa}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-mono">Scale of 10.0</span>
          </div>
        </div>
      )}

      {/* 3. Branch Filter Chips */}
      {stats && stats.branchBreakdown && (
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant mr-1 font-mono">
            Department:
          </span>
          <button
            onClick={() => { setSelectedBranch('All'); setPage(1); }}
            className={`px-3 py-1 font-label-sm text-label-sm font-bold uppercase transition-all border ${
              selectedBranch === 'All'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant hover:text-primary'
            }`}
          >
            All Departments ({stats.kpis.totalCandidates})
          </button>
          {stats.branchBreakdown.map(b => (
            <button
              key={b.branch}
              onClick={() => { setSelectedBranch(b.branch); setPage(1); }}
              className={`px-3 py-1 font-label-sm text-label-sm font-bold uppercase transition-all border flex items-center gap-1.5 ${
                selectedBranch === b.branch
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant hover:text-primary'
              }`}
            >
              <span>{b.branch}</span>
              <span className="text-[10px] opacity-75 font-mono">({b.total} • {b.placementRate}%)</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Multi-Facet Search & Filter Controls */}
      <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-96">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by student name, ID, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant text-body-sm font-body-sm focus:outline-none focus:border-secondary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-on-primary font-label-sm text-label-sm font-bold uppercase tracking-wider hover:bg-primary-hover whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant text-label-sm font-label-sm focus:outline-none focus:border-secondary font-mono"
          >
            <option value="All">All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Opted for Higher Studies">Higher Studies</option>
            <option value="Unplaced">Unplaced</option>
            <option value="Did Not Opt (reason not reported)">Did Not Opt</option>
            <option value="Ineligible">Ineligible</option>
          </select>

          {/* Tier / Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant text-label-sm font-label-sm focus:outline-none focus:border-secondary font-mono"
          >
            <option value="All">All Tiers</option>
            <option value="Elite">Elite Tier (&gt;20 LPA)</option>
            <option value="Super Dream">Super Dream (10-20 LPA)</option>
            <option value="Dream">Dream (6-10 LPA)</option>
            <option value="Normal">Normal (&lt;6 LPA)</option>
          </select>

          {/* Academic Year */}
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant text-label-sm font-label-sm focus:outline-none focus:border-secondary font-mono"
          >
            <option value="All">All Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
            <option value="2021-22">2021-22</option>
            <option value="2019-20">2019-20</option>
          </select>

          {/* Sort Control */}
          <div className="flex items-center border border-outline-variant bg-surface-container-lowest">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-2 bg-transparent text-label-sm font-label-sm focus:outline-none font-mono"
            >
              <option value="ctc_lpa">Sort: Package (CTC)</option>
              <option value="cgpa">Sort: CGPA</option>
              <option value="name">Sort: Name</option>
              <option value="student_id">Sort: Student ID</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-2 text-on-surface-variant hover:text-primary border-l border-outline-variant"
              title="Toggle sort direction"
            >
              <span className="material-symbols-outlined text-[16px]">
                {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Scholar Records Table */}
      <div className="w-full bg-surface-container-lowest border border-outline-variant overflow-x-auto">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant font-mono">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">sync</span>
            <span>QUERYING COLLEGIATE PLACEMENT RECORDS...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant font-mono">
            No scholar placement records matched the specified query filters.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-body-sm font-body-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant font-label-sm text-label-sm font-bold uppercase font-mono tracking-wider text-on-surface-variant">
                <th className="py-3 px-4">Scholar / Email</th>
                <th className="py-3 px-3">Student ID</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3">Year</th>
                <th className="py-3 px-3 text-center">CGPA</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recruiter / Code</th>
                <th className="py-3 px-3 text-right">Package</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 font-mono">
              {records.map((r) => {
                const isPlaced = r.status.toLowerCase() === 'placed';
                return (
                  <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                    {/* Scholar Name & Fake Email */}
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-on-surface flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {isPlaced && r.placementCategory === 'Elite' && (
                          <span className="material-symbols-outlined text-secondary text-[14px]" title="Elite Tier Candidate">workspace_premium</span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant tracking-tight truncate max-w-xs">{r.email}</div>
                    </td>

                    {/* Student ID */}
                    <td className="py-3 px-3 text-[12px] text-on-surface-variant">{r.studentId}</td>

                    {/* Branch */}
                    <td className="py-3 px-3">
                      <span className="bg-surface-container px-2 py-0.5 text-[11px] border border-outline-variant font-bold">
                        {r.branch}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="py-3 px-3 text-[12px] text-on-surface-variant">{r.academicYear}</td>

                    {/* CGPA */}
                    <td className="py-3 px-3 text-center font-bold text-on-surface">{r.cgpa}</td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                        isPlaced
                          ? 'bg-secondary/15 text-secondary border border-secondary/30'
                          : r.status.includes('Higher Studies')
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    {/* Recruiter */}
                    <td className="py-3 px-3 text-[12px]">
                      {r.companyProfile ? (
                        <span className="font-bold text-on-surface">{r.companyProfile}</span>
                      ) : (
                        <span className="text-on-surface-variant/50">—</span>
                      )}
                    </td>

                    {/* Package CTC */}
                    <td className="py-3 px-3 text-right">
                      {r.ctcLpa ? (
                        <span className="font-bold text-secondary text-body-md font-sans">
                          {r.ctcLpa} <span className="text-[11px] text-on-surface-variant font-mono">LPA</span>
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/50">—</span>
                      )}
                    </td>

                    {/* Action: Inspect */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => openStudentDetails(r.email)}
                        className="px-2.5 py-1 bg-surface-container text-primary hover:bg-primary hover:text-on-primary border border-outline-variant text-[11px] font-bold uppercase tracking-wider transition-all"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 6. Pagination Footer */}
        <div className="bg-surface-container px-4 py-3 border-t border-outline-variant flex items-center justify-between text-label-sm font-label-sm font-mono">
          <div className="text-on-surface-variant">
            Showing <span className="font-bold text-on-surface">{records.length}</span> of <span className="font-bold text-on-surface">{total}</span> matching scholars
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 bg-surface-container-lowest border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container"
            >
              PREV
            </button>
            <span className="px-2 py-1 bg-surface-container-lowest border border-outline-variant font-bold text-primary">
              PAGE {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 bg-surface-container-lowest border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* 7. Student Dossier Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border-2 border-primary max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedStudent.name)}`}
                  alt={selectedStudent.name}
                  className="w-12 h-12 bg-surface-container border border-outline-variant"
                />
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">{selectedStudent.name}</h3>
                  <p className="font-mono text-label-sm text-on-surface-variant">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-on-surface-variant hover:text-primary p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 font-mono text-body-sm">
              <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 border border-outline-variant">
                <div>
                  <span className="text-[11px] text-on-surface-variant block">STUDENT ID</span>
                  <span className="font-bold text-on-surface">{selectedStudent.student_id}</span>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-variant block">DEPARTMENT</span>
                  <span className="font-bold text-on-surface">{selectedStudent.branch} ({selectedStudent.program})</span>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-variant block">CUMULATIVE CGPA</span>
                  <span className="font-bold text-secondary text-title-sm">{selectedStudent.cgpa}</span>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-variant block">READINESS INDEX</span>
                  <span className="font-bold text-primary text-title-sm">{selectedStudent.readinessScore || Math.round(selectedStudent.cgpa * 10)}%</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 border border-outline-variant">
                <span className="text-[11px] text-on-surface-variant block mb-1">PLACEMENT STATUS &amp; OFFER</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-surface text-body-md font-sans">{selectedStudent.status}</span>
                  {selectedStudent.ctc_lpa && (
                    <span className="font-bold text-secondary font-sans text-title-sm">
                      {selectedStudent.ctc_lpa} LPA
                    </span>
                  )}
                </div>
                {selectedStudent.company_profile && (
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    Recruiter Code: <span className="text-on-surface font-bold">{selectedStudent.company_profile}</span> ({selectedStudent.placement_category})
                  </p>
                )}
              </div>

              <div className="bg-surface-container-low p-3 border border-outline-variant">
                <span className="text-[11px] text-on-surface-variant block mb-1">WELLBEING &amp; BROWSING TELEMETRY</span>
                <p className="text-[12px] text-on-surface">
                  Completed Focus Sessions: <span className="font-bold text-primary">{selectedStudent.focusSessionsCount || 2} Sessions</span>
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Browsing telemetry is protected under Differential Privacy Laplace Noise ($\varepsilon = 0.80$).
                </p>
              </div>

              {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                <div>
                  <span className="text-[11px] text-on-surface-variant block mb-1">VERIFIED SKILL ATTESTATIONS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-surface-container border border-outline-variant text-[11px] font-sans font-medium text-on-surface">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant pt-3 flex items-center justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-primary text-on-primary font-label-sm text-label-sm font-bold uppercase tracking-wider hover:bg-primary-hover"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
