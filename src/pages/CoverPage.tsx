import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Printer, ChevronRight } from 'lucide-react';

// Left-sidebar text: reads bottom-to-top (first char = bottom, last = top)
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

  // Sidebar label: address · builder · project name (first in HTML = bottom when rotated)
  const projectLine = [project.projectAddress, builder?.name, project.projectName]
    .filter(Boolean).join('   ·   ');

  // Letter landscape: 11 × 8.5 in.  Screen preview at max 940px wide → 729px tall.
  const SCREEN_W  = 940;
  const SCREEN_H  = Math.round(SCREEN_W * 8.5 / 11); // ≈ 727

  return (
    <>
      {/* ── Screen-only toolbar ── */}
      <div
        className="no-print"
        style={{ padding: '16px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
              <ChevronRight size={13} />
              <Link to={`/projects/${id}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                {project.projectName || 'Project'}
              </Link>
              <ChevronRight size={13} />
              Cover Page
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Cover Page</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to={`/projects/${id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f1f5f9', color: '#1e293b', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
            >
              ← Project Details
            </Link>
            <Link
              to={`/projects/${id}/proposal`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}
            >
              Proposal →
            </Link>
            <button
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>
          Print as <strong>Letter · Landscape</strong>. Upload a cover photo under <strong>Project Details → Drawings</strong>.
        </p>
      </div>

      {/* ── Cover Document (letter landscape preview) ── */}
      <div
        className="cover-outer"
        style={{ padding: '20px', background: '#d1d5db', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
      >
        <div
          id="cover-doc"
          style={{
            background: 'white',
            width: '100%',
            maxWidth: SCREEN_W,
            minHeight: SCREEN_H,
            boxShadow: '0 4px 24px rgba(0,0,0,0.20)',
            fontFamily: '"Times New Roman", Times, serif',
            display: 'flex',
          }}
        >
          {/* ── Left Sidebar ── */}
          <div style={{
            width: 46,
            borderRight: '1px solid #1e293b',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '14px 0',
            overflow: 'hidden',
          }}>
            {/* Project / Builder / Address */}
            <div style={{ ...V, fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a', lineHeight: 1.4 }}>
              {projectLine}
            </div>

            <div style={{ flex: 1 }} />

            {/* Estimate Completed */}
            <div style={{ ...V, lineHeight: 1.5, marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#cc0000' }}>{estimateDate}</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a' }}>{'   COMPLETED:   ESTIMATE'}</span>
            </div>

            <div style={{ height: 10 }} />

            {/* Proposal Due Date */}
            <div style={{ ...V, lineHeight: 1.5, marginBottom: 6 }}>
              <span style={{ fontSize: 7.5, color: '#555' }}>{'_________   '}</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a' }}>{'SUBMITTED:'}</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#cc0000' }}>{'   '}{dueDate}</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a' }}>{'   DUE DATE:   PROPOSAL'}</span>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 32px 16px', minWidth: 0 }}>

            {/* Title Block */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{
                fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                lineHeight: 1.1, fontSize: 'clamp(20px, 3.6vw, 36px)', color: '#111',
              }}>
                {project.projectName || 'Project Name'}
              </div>
              {project.projectAddress && (
                <div style={{
                  fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  lineHeight: 1.2, fontSize: 'clamp(18px, 3.1vw, 30px)', color: '#111', marginTop: 4,
                }}>
                  {project.projectAddress}
                </div>
              )}
              {project.cityState && (
                <div style={{
                  fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  lineHeight: 1.2, fontSize: 'clamp(16px, 2.8vw, 27px)', color: '#111', marginTop: 3,
                }}>
                  {project.cityState}
                </div>
              )}
            </div>

            {/* Project Photo */}
            <div style={{
              flex: 1,
              border: '1px solid #c0c0c0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              minHeight: 200,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {project.coverPhotoUrl ? (
                <img
                  src={project.coverPhotoUrl}
                  alt="Project Rendering"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                /* Screen-only hint — prints as clean empty white box */
                <div className="no-print" style={{ textAlign: 'center', color: '#cbd5e1', padding: 24 }}>
                  <p style={{ margin: 0, fontSize: 12 }}>
                    No photo —{' '}
                    <Link to={`/projects/${id}`} style={{ color: '#93c5fd' }}>
                      upload under Project Details → Drawings
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Company Footer */}
            <div style={{ textAlign: 'center', paddingTop: 10, borderTop: '1px solid #ccc' }}>
              <div style={{
                fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
                fontWeight: 700, letterSpacing: '0.07em', color: '#111',
                lineHeight: 1.1, fontSize: 'clamp(18px, 3vw, 28px)', marginBottom: 4,
              }}>
                E.D.{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '1.15em', letterSpacing: '-0.01em' }}>M</em>iller{' '}
                ENGINEERING
              </div>
              <div style={{
                fontSize: 'clamp(8px, 0.9vw, 10px)',
                fontFamily: 'Arial, Helvetica, sans-serif',
                color: '#444', letterSpacing: '0.06em',
              }}>
                EDDIE MILLER P.E. 36543&nbsp;&nbsp;✦&nbsp;&nbsp;9736 BROCKBANK, DALLAS, TEXAS 75220&nbsp;&nbsp;✦&nbsp;&nbsp;214-351-6171&nbsp;&nbsp;✦&nbsp;&nbsp;FIRM# 123232
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Print styles: Letter Landscape ── */}
      <style>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 0.3in;
          }
          body { background: white !important; }
          aside, nav { display: none !important; }
          .no-print { display: none !important; }
          .cover-outer {
            background: white !important;
            padding: 0 !important;
            display: block !important;
          }
          #cover-doc {
            max-width: none !important;
            width: calc(11in - 0.6in) !important;
            min-height: calc(8.5in - 0.6in) !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
