import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Printer, ChevronRight } from 'lucide-react';

// Reads bottom-to-top on the left margin — first char = bottom, last = top
const V: React.CSSProperties = {
  writingMode: 'vertical-rl' as const,
  transform: 'rotate(180deg)',
  whiteSpace: 'nowrap',
  fontFamily: '"Times New Roman", Times, serif',
};

function fmtDate(s?: string): string {
  if (!s) return '___________';
  const d = new Date(s.includes('T') ? s : s + 'T00:00');
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
}

export default function CoverPage() {
  const { id } = useParams<{ id: string }>();
  const { projects, builders } = useStore();

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div style={{ padding: 32, color: '#ef4444' }}>
        Project not found.{' '}
        <Link to="/" style={{ color: '#3b82f6' }}>Back to Dashboard</Link>
      </div>
    );
  }

  const builder = builders.find((b) => b.id === project.builderId);

  const estimateDate = fmtDate(project.bidStartDate || project.createdAt);
  const dueDate      = fmtDate(project.bidDueDate);

  // Sidebar project info: write in reverse so first = bottom (reads upward)
  const projectLine = [project.projectAddress, builder?.name, project.projectName]
    .filter(Boolean).join('   ·   ');

  return (
    <>
      {/* ── Screen-only toolbar ── */}
      <div
        className="no-print"
        style={{ padding: '20px 32px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
              <ChevronRight size={13} />
              <Link to={`/projects/${id}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                {project.projectName || 'Project'}
              </Link>
              <ChevronRight size={13} />
              Cover Page
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Cover Page Preview</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to={`/projects/${id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', color: '#1e293b', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
            >
              ← Project Details
            </Link>
            <Link
              to={`/projects/${id}/proposal`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
            >
              Proposal →
            </Link>
            <button
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
        <p className="no-print" style={{ margin: '0 0 4px', fontSize: 12.5, color: '#94a3b8' }}>
          Upload a cover photo under <strong>Project Details → Drawings tab</strong> to add a project image.
          When printing, set paper size to <strong>11 × 17 (Tabloid)</strong> in your print dialog.
        </p>
      </div>

      {/* ── Cover Document ── */}
      <div
        className="cover-outer"
        style={{ padding: '24px', background: '#e5e7eb', minHeight: '80vh', display: 'flex', justifyContent: 'center' }}
      >
        <div
          id="cover-doc"
          style={{
            background: 'white',
            width: '100%',
            maxWidth: 860,
            /* 11:17 aspect ratio = 860 × 1329 px for screen preview */
            minHeight: Math.round(860 * 17 / 11),
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            fontFamily: '"Times New Roman", Times, serif',
            display: 'flex',
            position: 'relative',
          }}
        >
          {/* ════════════════════════════════════
              LEFT SIDEBAR  ~0.6in wide
          ════════════════════════════════════ */}
          <div style={{
            width: 52,
            borderRight: '1px solid #1e293b',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0 20px',
            overflow: 'hidden',
          }}>

            {/* Project / Builder / Address — reads upward from bottom of this block */}
            <div style={{ ...V, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a', lineHeight: 1.4 }}>
              {projectLine}
            </div>

            {/* Push dates toward the center/lower portion */}
            <div style={{ flex: 1 }} />

            {/* ESTIMATE COMPLETED — date first so it appears at BOTTOM (first read when tilted) */}
            <div style={{ ...V, lineHeight: 1.5, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#cc0000' }}>{estimateDate}</span>
              <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a1a1a' }}>{'   COMPLETED:   ESTIMATE'}</span>
            </div>

            <div style={{ height: 14 }} />

            {/* PROPOSAL DUE DATE — date first, then labels */}
            <div style={{ ...V, lineHeight: 1.5, marginBottom: 8 }}>
              <span style={{ fontSize: 8.5, letterSpacing: '0.03em', color: '#555' }}>{'___________   '}</span>
              <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a1a1a' }}>SUBMITTED:</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#cc0000' }}>{'   '}{dueDate}</span>
              <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1a1a1a' }}>{'   DUE DATE:   PROPOSAL'}</span>
            </div>
          </div>

          {/* ════════════════════════════════════
              MAIN CONTENT AREA
          ════════════════════════════════════ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px 24px', minWidth: 0 }}>

            {/* ── Title Block ── */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                fontSize: 'clamp(28px, 5.5vw, 48px)',
                color: '#111',
              }}>
                {project.projectName || 'Project Name'}
              </div>
              {project.projectAddress && (
                <div style={{
                  fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  fontSize: 'clamp(24px, 4.8vw, 42px)',
                  color: '#111',
                  marginTop: 6,
                }}>
                  {project.projectAddress}
                </div>
              )}
              {project.cityState && (
                <div style={{
                  fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                  fontSize: 'clamp(22px, 4.3vw, 38px)',
                  color: '#111',
                  marginTop: 6,
                }}>
                  {project.cityState}
                </div>
              )}
            </div>

            {/* ── Project Photo ── */}
            <div style={{
              flex: 1,
              border: '1px solid #c8c8c8',
              background: project.coverPhotoUrl ? '#000' : '#f0f4f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              minHeight: 300,
              overflow: 'hidden',
            }}>
              {project.coverPhotoUrl ? (
                <img
                  src={project.coverPhotoUrl}
                  alt="Project Rendering"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="no-print" style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                  <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14, opacity: 0.25 }}>🏗</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                    No cover photo yet.
                    <br />
                    <Link to={`/projects/${id}`} style={{ color: '#3b82f6', fontWeight: 600 }}>
                      Upload one under Project Details → Drawings
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* ── Company Footer ── */}
            <div style={{ textAlign: 'center', paddingTop: 14, borderTop: '1px solid #ccc' }}>
              <div style={{
                fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#111',
                lineHeight: 1.1,
                fontSize: 'clamp(22px, 4vw, 36px)',
                marginBottom: 6,
              }}>
                {/* Stylized "M" in italic */}
                E.D.{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '1.15em', letterSpacing: '-0.01em' }}>M</em>iller{' '}
                ENGINEERING
              </div>
              <div style={{
                fontSize: 'clamp(9px, 1vw, 11px)',
                fontFamily: 'Arial, Helvetica, sans-serif',
                color: '#444',
                letterSpacing: '0.06em',
                fontWeight: 400,
              }}>
                EDDIE MILLER P.E. 36543&nbsp;&nbsp;✦&nbsp;&nbsp;9736 BROCKBANK, DALLAS, TEXAS 75220&nbsp;&nbsp;✦&nbsp;&nbsp;214-351-6171&nbsp;&nbsp;✦&nbsp;&nbsp;FIRM# 123232
              </div>
            </div>

          </div>{/* end main content */}
        </div>{/* end cover-doc */}
      </div>{/* end cover-outer */}

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          @page {
            size: 11in 17in portrait;
            margin: 0.3in 0.25in;
          }
          body { background: white !important; }
          aside, nav { display: none !important; }
          .no-print { display: none !important; }
          .cover-outer {
            background: white !important;
            padding: 0 !important;
            min-height: 0 !important;
            display: block !important;
          }
          #cover-doc {
            max-width: none !important;
            width: calc(11in - 0.5in) !important;
            min-height: calc(17in - 0.6in) !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          /* Force the photo area to have some height on print */
          #cover-doc img {
            max-height: calc(17in - 5in);
            object-fit: cover;
          }
        }
      `}</style>
    </>
  );
}
