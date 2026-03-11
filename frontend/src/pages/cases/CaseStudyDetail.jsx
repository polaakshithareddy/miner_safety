import { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import { AuthContext } from '../../context/AuthContext';
import { logBehaviorEvent } from '../../utils/behaviorTracker';

const SectionCard = ({ title, children, actions }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{title}</p>
      </div>
      {actions}
    </div>
    {children}
  </div>
);

const CaseStudyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = user?.role || 'worker';

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizResponses, setQuizResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hasLoggedView, setHasLoggedView] = useState(false);
  const [hasLoggedVideoStart, setHasLoggedVideoStart] = useState(false);
  const videoProgressRef = useRef({ lastTime: 0 });

  const isPrivileged = useMemo(
    () => ['supervisor', 'admin', 'dgms_officer'].includes(role),
    [role],
  );

  const fetchCaseStudy = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cases/${id}`, {
        params: { role },
      });
      setCaseData(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch case study', error);
      toast.error('Unable to load case study');
      navigate('/case-studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseStudy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, role]);

  useEffect(() => {
    if (caseData && !hasLoggedView) {
      api.post(`/cases/${id}/engagement`, { action: 'view' }).catch(() => null);
      setHasLoggedView(true);
    }
  }, [caseData, hasLoggedView, id]);

  const logCompletion = async (score) => {
    try {
      setSubmitting(true);
      await api.post(`/cases/${id}/engagement`, {
        action: 'complete',
        quizScore: typeof score === 'number' ? score : undefined,
      });
      toast.success('Completion logged');
      fetchCaseStudy();
    } catch (error) {
      console.error('Failed to log completion', error);
      toast.error('Unable to log completion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/cases/${id}/approve`);
      toast.success('Case study approved and published');
      fetchCaseStudy();
    } catch (error) {
      console.error('Failed to approve case study', error);
      toast.error('Approval failed');
    }
  };

  const handleMicroVideoPlay = () => {
    if (!caseData || hasLoggedVideoStart) return;
    logBehaviorEvent('video_started', {
      source: 'case_study',
      caseId: id,
      title: caseData.title,
    });
    setHasLoggedVideoStart(true);
  };

  const handleMicroVideoTimeUpdate = (event) => {
    if (!caseData) return;
    const currentTime = event.target.currentTime || 0;
    const lastTime = videoProgressRef.current.lastTime || 0;
    const deltaSeconds = Math.max(0, currentTime - lastTime);

    if (deltaSeconds >= 15) {
      logBehaviorEvent('video_progress', {
        source: 'case_study',
        caseId: id,
        title: caseData.title,
        deltaSeconds,
        positionSeconds: currentTime,
      });
    }

    videoProgressRef.current.lastTime = currentTime;
  };

  const handleMicroVideoEnded = (event) => {
    if (!caseData) return;
    const durationSeconds = Math.round(event.target.duration || event.target.currentTime || 0);
    logBehaviorEvent('video_completed', {
      source: 'case_study',
      caseId: id,
      title: caseData.title,
      durationSeconds,
    });
  };

  const handleQuizSubmit = (event) => {
    event.preventDefault();
    if (!caseData?.quiz?.length) {
      logCompletion();
      return;
    }
    const answered = Object.keys(quizResponses).length;
    if (answered !== caseData.quiz.length) {
      toast.error('Please answer all quiz questions');
      return;
    }
    const correctAnswers = caseData.quiz.reduce((score, question, index) => (
      question.correctOption === Number(quizResponses[index]) ? score + 1 : score
    ), 0);
    const percentage = Math.round((correctAnswers / caseData.quiz.length) * 100);
    logCompletion(percentage);
  };

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  const workerChecklist = caseData.checklist || caseData.workerChecklist || [];
  const supervisorChecklist = caseData.supervisorChecklist || [];

  return (
    <div className="space-y-8 mt-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-300/60">
        <div className="rounded-[28px] bg-gradient-to-br from-white via-slate-50 to-slate-100 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Case study</p>
              <h1 className="mt-3 text-3xl font-black text-slate-900">{caseData.title}</h1>
              <p className="mt-3 text-base text-slate-600">{caseData.quickSummary}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{new Date(caseData.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{caseData.location}</span>
                <span>•</span>
                <span className="uppercase tracking-widest text-slate-700">{caseData.severity}</span>
                {caseData.tags?.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Status</span>
                <span className={`rounded-full px-3 py-1 font-semibold ${caseData.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {caseData.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Views</span>
                <strong className="text-slate-900">{caseData.engagementStats?.views ?? 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Completions</span>
                <strong className="text-slate-900">{caseData.engagementStats?.completions ?? 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Avg quiz score</span>
                <strong className="text-slate-900">
                  {caseData.engagementStats?.averageQuizScore ?? 0}%
                </strong>
              </div>
              {isPrivileged && caseData.status !== 'published' && (
                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded-xl bg-slate-900 py-2 font-semibold text-white shadow"
                >
                  Approve & Publish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metadata Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Source Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Source</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Type</span>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {caseData.sourceType}
              </span>
            </div>
            {caseData.mineSection && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Section</span>
                <span className="text-sm font-medium text-slate-900">{caseData.mineSection}</span>
              </div>
            )}
            {caseData.sourceDocumentUrl && (
              <a
                href={caseData.sourceDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                View Source Doc
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Hazard Tags */}
        {caseData.hazardTags && caseData.hazardTags.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Hazard Types</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {caseData.hazardTags.map((hazard) => (
                <span key={hazard} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                  {hazard}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Relevant Roles */}
        {caseData.relevanceRoles && caseData.relevanceRoles.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Relevant For</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {caseData.relevanceRoles.map((role) => (
                <span key={role} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata Statistics */}
      {caseData.metadata && Object.keys(caseData.metadata).some(key => caseData.metadata[key]) && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-4">Additional Details</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {caseData.metadata.casualties && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs text-red-600">Casualties</p>
                <p className="mt-1 text-2xl font-bold text-red-900">{caseData.metadata.casualties}</p>
              </div>
            )}
            {caseData.metadata.equipmentInvolved && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Equipment</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{caseData.metadata.equipmentInvolved}</p>
              </div>
            )}
            {caseData.metadata.weather && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Weather</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{caseData.metadata.weather}</p>
              </div>
            )}
            {caseData.metadata.shift && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Shift</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{caseData.metadata.shift}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supervisor Summary - For Privileged Users */}
      {isPrivileged && caseData.supervisorSummary && (
        <SectionCard title="Supervisor Summary">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-base text-slate-700 leading-relaxed">{caseData.supervisorSummary}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {caseData.microVideo?.url && (
        <SectionCard title="Micro video">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video
              controls
              poster={caseData.microVideo.thumbnail}
              className="h-full w-full object-cover"
              onPlay={handleMicroVideoPlay}
              onTimeUpdate={handleMicroVideoTimeUpdate}
              onEnded={handleMicroVideoEnded}
            >
              <source src={caseData.microVideo.url} type="video/mp4" />
            </video>
          </div>
        </SectionCard>
      )}

      {!isPrivileged && (
        <section className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="3-step checklist">
            <ol className="space-y-4 text-slate-700">
              {workerChecklist.length ? workerChecklist.map((item, index) => (
                <li key={item.text || index} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <p className="text-base">{item.text || item}</p>
                </li>
              )) : <p className="text-sm text-slate-400">Checklist coming soon.</p>}
            </ol>
          </SectionCard>

          <SectionCard title="Quick summary">
            <p className="text-base text-slate-600">{caseData.quickSummary || 'Summary coming soon.'}</p>
          </SectionCard>
        </section>
      )}

      {/* Root Causes - Available to ALL users (moved from privileged section) */}
      {caseData.rootCauses && caseData.rootCauses.length > 0 && (
        <SectionCard title="Root Causes - What Went Wrong">
          <div className="grid gap-4 md:grid-cols-2">
            {caseData.rootCauses.map((root, index) => {
              const typeColors = {
                human: 'border-orange-200 bg-orange-50',
                technical: 'border-red-200 bg-red-50',
                environmental: 'border-green-200 bg-green-50',
                organizational: 'border-purple-200 bg-purple-50',
                system: 'border-blue-200 bg-blue-50',
                management: 'border-amber-200 bg-amber-50',
                other: 'border-slate-200 bg-slate-50',
              };
              const typeBadgeColors = {
                human: 'bg-orange-600 text-white',
                technical: 'bg-red-600 text-white',
                environmental: 'bg-green-600 text-white',
                organizational: 'bg-purple-600 text-white',
                system: 'bg-blue-600 text-white',
                management: 'bg-amber-600 text-white',
                other: 'bg-slate-600 text-white',
              };
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl border p-5 shadow-sm ${typeColors[root.type] || typeColors.other}`}
                >
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${typeBadgeColors[root.type] || typeBadgeColors.other}`}>
                    {root.type}
                  </span>
                  <p className="mt-3 text-base text-slate-800 leading-relaxed">{root.description}</p>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {isPrivileged && (
        <section className="space-y-6">
          <SectionCard title="Timeline">
            <div className="space-y-4">
              {caseData.timeline?.length ? caseData.timeline.map((entry) => (
                <div key={`${entry.timestampLabel}-${entry.description}`} className="flex gap-4">
                  <div className="min-w-[120px] text-sm font-semibold text-blue-600">{entry.timestampLabel}</div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-slate-700">{entry.description}</div>
                </div>
              )) : <p className="text-sm text-slate-400">Timeline coming soon.</p>}
            </div>
          </SectionCard>

          <SectionCard title="Root causes & actions">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Root causes</h4>
                <ul className="mt-3 space-y-3">
                  {caseData.rootCauses?.length ? caseData.rootCauses.map((root) => (
                    <li key={`${root.type}-${root.description}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-widest text-slate-500">{root.type}</p>
                      <p className="mt-2 text-slate-700">{root.description}</p>
                    </li>
                  )) : <p className="text-sm text-slate-400">Root cause analysis pending.</p>}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Corrective actions</h4>
                <ul className="mt-3 space-y-3">
                  {caseData.immediateActions?.length ? caseData.immediateActions.map((action) => (
                    <li key={`${action.title}-${action.description}`} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">{action.title}</p>
                      <p className="mt-2 text-emerald-700">{action.description}</p>
                      {action.responsibleRole && (
                        <p className="mt-2 text-xs uppercase tracking-widest text-emerald-600">
                          Owner: {action.responsibleRole}
                        </p>
                      )}
                    </li>
                  )) : <p className="text-sm text-slate-400">Add corrective actions to brief crews.</p>}
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Supervisor checklist">
            <ul className="space-y-3">
              {supervisorChecklist.length ? supervisorChecklist.map((item, index) => (
                <li key={item.text || index} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mt-1 h-3 w-3 rounded-full bg-emerald-500"></span>
                  <div>
                    <p className="text-slate-700">{item.text || item}</p>
                    {item.role && <p className="text-xs uppercase tracking-widest text-slate-500">{item.role}</p>}
                  </div>
                </li>
              )) : <p className="text-sm text-slate-400">Supervisor checklist pending.</p>}
            </ul>
          </SectionCard>
        </section>
      )}

      {/* External Article Link - Prominent Display */}
      {caseData.articleLink && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.4em] text-blue-600 font-semibold">External Source</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Read Full Article for More Details</h3>
              <p className="mt-2 text-sm text-slate-600">Access the complete incident report, investigation findings, and additional documentation from verified sources.</p>
              <a
                href={caseData.articleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
              >
                Open External Article
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed Description Sections */}
      {caseData.detailedDescription && (
        <section className="space-y-6">
          {/* Background */}
          {caseData.detailedDescription.background && (
            <SectionCard title="Incident Background">
              <p className="text-base text-slate-700 leading-relaxed">{caseData.detailedDescription.background}</p>
            </SectionCard>
          )}

          {/* Sequence of Events */}
          {caseData.detailedDescription.sequenceOfEvents && caseData.detailedDescription.sequenceOfEvents.length > 0 && (
            <SectionCard title="Sequence of Events">
              <div className="space-y-4">
                {caseData.detailedDescription.sequenceOfEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                      {index + 1}
                    </div>
                    <div className="flex-1 rounded-2xl border border-red-100 bg-red-50 p-4 text-slate-700">
                      {event}
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Communication Failure Details */}
          {caseData.detailedDescription.communicationFailureDetails && caseData.detailedDescription.communicationFailureDetails.length > 0 && (
            <SectionCard title="Communication Failures">
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Critical Communication Gaps</p>
                </div>
                <ul className="space-y-3">
                  {caseData.detailedDescription.communicationFailureDetails.map((failure, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-600"></span>
                      <span className="text-slate-700">{failure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          )}

          {/* Why Workers Continued Working */}
          {caseData.detailedDescription.whyWorkersContinuedWorking && caseData.detailedDescription.whyWorkersContinuedWorking.length > 0 && (
            <SectionCard title="Why Workers Continued Working">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="mb-4 text-sm text-slate-600">Understanding why workers didn't evacuate helps prevent similar incidents:</p>
                <ul className="space-y-3">
                  {caseData.detailedDescription.whyWorkersContinuedWorking.map((reason, index) => (
                    <li key={index} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-400"></span>
                      <span className="text-slate-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          )}

          {/* Impact Statistics */}
          {caseData.detailedDescription.impact && (
            <SectionCard title="Incident Impact">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(caseData.detailedDescription.impact).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </section>
      )}

      {/* Preventive Checklist - Enhanced Display */}
      {caseData.preventiveChecklist && caseData.preventiveChecklist.length > 0 && (
        <SectionCard title="Preventive Checklist - Learn from This Incident">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Role-specific actions to prevent similar incidents:</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {caseData.preventiveChecklist.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.text}</p>
                    {item.role && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.role}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Quiz & assignment">
          <form className="space-y-6" onSubmit={handleQuizSubmit}>
            {caseData.quiz?.length ? caseData.quiz.map((question, index) => (
              <div key={question.question} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">{question.question}</p>
                <div className="mt-3 space-y-2">
                  {question.options?.map((option, optionIndex) => (
                    <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionIndex}
                        checked={Number(quizResponses[index]) === optionIndex}
                        onChange={(e) => setQuizResponses((prev) => ({ ...prev, [index]: e.target.value }))}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Quiz coming soon. You can still log completion.</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit & Mark Complete'}
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Related references">
          <ul className="space-y-4 text-sm text-slate-600">
            {/* Show Article Link First if Available */}
            {caseData.articleLink && (
              <li className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">External Article - Full Incident Report</p>
                    <p className="mt-1 text-xs text-slate-600">Verified source with complete investigation details</p>
                    <a
                      href={caseData.articleLink}
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read Full Article
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </li>
            )}

            {/* Other Related References */}
            {caseData.relatedReferences?.length > 0 && caseData.relatedReferences.map((reference) => (
              <li key={reference.url} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-800">{reference.label}</p>
                <a
                  href={reference.url}
                  className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open document
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}

            {/* No References Message */}
            {!caseData.articleLink && (!caseData.relatedReferences || caseData.relatedReferences.length === 0) && (
              <li className="text-center text-slate-400 py-4">No supporting references added.</li>
            )}
          </ul>
        </SectionCard>
      </section>
    </div>
  );
};

export default CaseStudyDetail;

