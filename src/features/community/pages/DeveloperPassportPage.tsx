import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DeveloperAvatar } from '../components/DeveloperLink'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from '../../../services/communityService'
import { getCommunityArticles } from '../../../services/communityArticleService'
import { getCommunityAnswers, getCommunityQuestions } from '../../../services/communityQuestionService'
import { getDeveloperProfile, getFollowerCount, getFollowingCount, updateDeveloperProfile } from '../../../services/developerProfileService'
import { getProjectsForUser, getProjectMemberRole } from '../../../services/projectService'
import { getLearningEnrollments, getLearningPath } from '../../../services/learningService'
import { getLearningRoadmaps, getRoadmapProgress } from '../../../services/learningRoadmapService'
import { getMemberships } from '../../../services/circleMembership'
import { learningCircles } from '../../../data/mockData'
import { getArenaProgress } from '../../../services/codeArenaService'
import { getPassportSettings, updatePassportSettings, type PassportSkill, type SkillProficiency } from '../../../services/passportService'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100'

function EditPassport({ developerId, onSaved, onCancel }: { developerId: string; onSaved: () => void; onCancel: () => void }) {
  const profile = getDeveloperProfile(developerId)
  const current = getPassportSettings(developerId)
  const [headline, setHeadline] = useState(current.headline)
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [github, setGithub] = useState(profile?.githubUrl ?? '')
  const [linkedin, setLinkedin] = useState(profile?.linkedinUrl ?? '')
  const [publicProfile, setPublicProfile] = useState(current.publicProfile)
  const [showLocation, setShowLocation] = useState(current.showLocation)
  const [showLinks, setShowLinks] = useState(current.showLinks)
  const [skills, setSkills] = useState<PassportSkill[]>(current.skills)
  const [name, setName] = useState('')
  const [experience, setExperience] = useState('')
  const [proficiency, setProficiency] = useState<SkillProficiency>('Beginner')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  if (!profile) return null

  const addSkill = () => {
    const trimmed = name.trim()
    if (!trimmed) return setFeedback('Enter a skill before adding it.')
    if (skills.some((skill) => skill.name.toLowerCase() === trimmed.toLowerCase())) return setFeedback('That skill is already listed.')
    setSkills([...skills, { name: trimmed, proficiency, experience }])
    setName(''); setExperience(''); setFeedback('')
  }
  const save = () => {
    setSaving(true)
    const profileResult = updateDeveloperProfile({ fullName: profile.fullName, username: profile.username, bio, location, skills: profile.skills, interests: profile.interests, githubUrl: github, linkedinUrl: linkedin })
    if (!profileResult.ok) { setFeedback(profileResult.message); setSaving(false); return }
    const result = updatePassportSettings({ developerId, headline, publicProfile, showLocation, showLinks, skills })
    setFeedback(result.message)
    setSaving(false)
    if (result.ok) onSaved()
  }

  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="edit-passport-heading">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Profile settings</p><h2 id="edit-passport-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Edit your passport</h2><p className="mt-2 text-sm leading-6 text-slate-500">Shape how other developers see your work and interests.</p></div>
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5"><DeveloperAvatar profile={profile} size="sm" /><Link to="/profile" className="text-sm font-semibold text-violet-700 hover:text-violet-900">Change photo</Link></div>
    </div>
    <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700 md:col-span-2">Professional headline<input maxLength={120} value={headline} onChange={(event) => setHeadline(event.target.value)} className={fieldClass} placeholder="Add a short professional headline" /></label>
      <label className="block text-sm font-semibold text-slate-700 md:col-span-2">Bio<textarea value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} rows={4} className={`${fieldClass} resize-y py-3 leading-6`} placeholder="Share a little about your work and interests" /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{bio.length}/500</span></label>
      <label className="block text-sm font-semibold text-slate-700">Location<input value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClass} placeholder="Add your location" /></label>
      <label className="block text-sm font-semibold text-slate-700">GitHub URL<input type="url" value={github} onChange={(event) => setGithub(event.target.value)} className={fieldClass} placeholder="https://github.com/…" /></label>
      <label className="block text-sm font-semibold text-slate-700 md:col-span-2">LinkedIn URL<input type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} className={fieldClass} placeholder="https://linkedin.com/in/…" /></label>
    </div>
    <fieldset className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"><legend className="px-1 text-sm font-bold text-slate-800">Privacy and visibility</legend><div className="grid gap-3 sm:grid-cols-3">
      {[[publicProfile, setPublicProfile, 'Public profile', 'Let developers view your passport.'], [showLocation, setShowLocation, 'Show location', 'Display your location on the passport.'], [showLinks, setShowLinks, 'Show profile links', 'Display GitHub and LinkedIn links.']].map(([checked, setter, label, hint]) => <label key={label as string} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"><input type="checkbox" checked={checked as boolean} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600 focus:ring-violet-500" /><span><span className="block text-sm font-semibold text-slate-800">{label as string}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{hint as string}</span></span></label>)}
    </div></fieldset>
    <div className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5"><div><h3 className="font-bold text-slate-900">Skills and technologies</h3><p className="mt-1 text-sm text-slate-500">Add skills with a proficiency level and optional experience note.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(130px,0.7fr)_minmax(0,1fr)_auto]"><input aria-label="New passport skill" value={name} onChange={(event) => setName(event.target.value)} placeholder="Skill name" className={`${fieldClass} mt-0`} /><select aria-label="Skill proficiency" value={proficiency} onChange={(event) => setProficiency(event.target.value as SkillProficiency)} className={`${fieldClass} mt-0`}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><input aria-label="Skill experience" value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="Experience (optional)" className={`${fieldClass} mt-0`} /><button type="button" onClick={addSkill} className="min-h-12 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200">Add skill</button></div>{skills.length ? <ul className="mt-4 divide-y divide-slate-100">{skills.map((skill, index) => <li key={`${skill.name}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="min-w-0"><strong className="text-sm text-slate-900">{skill.name}</strong><span className="ml-2 text-sm text-slate-500">{skill.proficiency}{skill.experience && ` · ${skill.experience}`}</span></span><button type="button" onClick={() => setSkills(skills.filter((_, itemIndex) => itemIndex !== index))} className="min-h-9 rounded-lg px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200">Remove</button></li>)}</ul> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No additional passport skills yet. Add one above, or use the skills from your profile.</p>}</div>
    {feedback && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{feedback}</p>}
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50">Cancel</button><button type="button" onClick={save} disabled={saving} className="min-h-11 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button></div>
  </section>
}

function PassportSection({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">{eyebrow}</p>}<h2 className={`${eyebrow ? 'mt-1' : ''} text-xl font-bold tracking-tight text-slate-950 sm:text-2xl`}>{title}</h2>{children}</section>
}

export function DeveloperPassportPage() {
  const { developerId } = useParams()
  const id = developerId ?? COMMUNITY_USER_ID
  const [, refresh] = useState(0)
  const [editing, setEditing] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')
  useEffect(() => { const update = () => refresh((value) => value + 1); window.addEventListener(COMMUNITY_CHANGED_EVENT, update); return () => window.removeEventListener(COMMUNITY_CHANGED_EVENT, update) }, [])
  const profile = getDeveloperProfile(id)
  if (!profile) return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-2xl text-violet-700">?</div><h1 className="mt-4 text-2xl font-bold text-slate-950">Developer not found</h1><p className="mt-2 text-sm text-slate-600">This passport may have moved or is no longer available.</p><Link to="/developers" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800">Browse developers</Link></div>

  const settings = getPassportSettings(id)
  const own = id === COMMUNITY_USER_ID
  const articles = getCommunityArticles().filter((item) => item.authorId === id && item.status === 'Published')
  const answers = getCommunityQuestions().flatMap((question) => getCommunityAnswers(question.id)).filter((item) => item.authorId === id)
  const projects = getProjectsForUser(id)
  const enrollments = getLearningEnrollments().filter((item) => id === COMMUNITY_USER_ID && getLearningPath(item.pathId))
  const completedPaths = enrollments.filter((item) => item.progress === 100)
  const completedMilestones = getLearningRoadmaps().flatMap((roadmap) => { const progress = getRoadmapProgress(roadmap.id); return progress?.completedMilestoneIds.map((milestoneId) => ({ roadmap, milestone: roadmap.milestones.find((item) => item.id === milestoneId) })) ?? [] }).filter((item) => item.milestone && id === COMMUNITY_USER_ID)
  const arenaProgress = own ? getArenaProgress() : { solvedChallengeIds: [], points: 0 }
  const joinedCircles = getMemberships(id).map((membership) => learningCircles.find((circle) => circle.id === membership.circleId)).filter((circle): circle is typeof learningCircles[number] => Boolean(circle))
  const achievements = [...completedPaths.map((item) => `Completed ${getLearningPath(item.pathId)?.title}`), ...completedMilestones.map((item) => `Completed ${item.milestone?.title}`), ...articles.map((item) => `Published ${item.title}`), ...answers.map(() => 'Answered a community question'), ...(arenaProgress.solvedChallengeIds.length ? [`Solved ${arenaProgress.solvedChallengeIds.length} Code Arena challenge${arenaProgress.solvedChallengeIds.length === 1 ? '' : 's'}`] : [])]
  const publicSettings = settings
  const displayedSkills = [...profile.skills.map((name) => ({ name, proficiency: 'Intermediate' as const })), ...settings.skills].filter((skill, index, all) => all.findIndex((item) => item.name.toLowerCase() === skill.name.toLowerCase()) === index)
  const completion = Math.round(([profile.bio, profile.skills.length, profile.interests.length, settings.headline, profile.location].filter(Boolean).length / 5) * 100)
  const copyUrl = async () => { try { if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href); else throw new Error('Clipboard unavailable'); setCopyFeedback('Profile URL copied.') } catch { setCopyFeedback('Copy is unavailable in this browser. Copy the URL from the address bar.') } }

  return <main className="mx-auto w-full max-w-6xl space-y-6 pb-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/developers" className="inline-flex min-h-10 items-center rounded-lg pr-2 text-sm font-semibold text-violet-700 hover:text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-300">← All developers</Link><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={copyUrl} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-violet-200 hover:text-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-100">Share passport</button>{own && <button type="button" onClick={() => setEditing((value) => !value)} className="min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200">{editing ? 'Close editor' : 'Edit passport'}</button>}{copyFeedback && <span role="status" className="text-sm text-slate-600">{copyFeedback}</span>}</div></div>
    {!publicSettings.publicProfile && !own ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Developer Passport</p><h1 className="mt-2 text-2xl font-bold text-slate-950">This passport is private</h1><p className="mt-2 text-sm text-slate-600">The developer has chosen not to share this profile publicly.</p></div> : <>
      <section className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/80 shadow-sm">
        <div className="h-2 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-indigo-400" />
        <div className="p-5 sm:p-8 lg:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="rounded-full bg-white p-1.5 shadow-md ring-1 ring-violet-100"><DeveloperAvatar profile={profile} size="lg" /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-violet-700">Developer Passport <span className="mx-1 text-slate-300">/</span> @{profile.username}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{profile.fullName}</h1></div>{own && <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">{completion}% profile complete</span>}</div>
            {settings.headline ? <p className="mt-3 text-lg font-semibold text-violet-800">{settings.headline}</p> : own && <p className="mt-3 text-sm font-medium text-violet-700">Add a professional headline to introduce your work.</p>}
            {profile.bio && <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{profile.bio}</p>}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span><strong className="text-slate-900">{getFollowerCount(profile.id)}</strong> followers</span><span><strong className="text-slate-900">{getFollowingCount(profile.id)}</strong> following</span><span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>{publicSettings.showLocation && profile.location && <span>{profile.location}</span>}</div>
            {publicSettings.showLinks && (profile.githubUrl || profile.linkedinUrl) && <div className="mt-5 flex flex-wrap gap-3">{profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus:outline-none focus:ring-4 focus:ring-violet-100">GitHub ↗</a>}{profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus:outline-none focus:ring-4 focus:ring-violet-100">LinkedIn ↗</a>}</div>}
          </div>
        </div></div>
      </section>

      {editing && own && <EditPassport developerId={id} onSaved={() => { setEditing(false); refresh((value) => value + 1) }} onCancel={() => setEditing(false)} />}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <PassportSection title="Skills and technologies" eyebrow="What I work with"><div className="mt-5 flex flex-wrap gap-2">{displayedSkills.map((skill) => <span key={skill.name} className="rounded-xl border border-violet-100 bg-violet-50/70 px-3.5 py-2 text-sm font-semibold text-violet-800">{skill.name}<span className="ml-2 font-normal text-violet-600">{skill.proficiency}</span></span>)}{profile.interests.map((interest) => <span key={interest} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700">{interest}</span>)}</div>{displayedSkills.length === 0 && profile.interests.length === 0 && <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No skills or interests have been added yet.</p>}</PassportSection>
        <PassportSection title="Code Arena" eyebrow="Practice and progress"><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-3xl font-bold tracking-tight text-violet-900">{arenaProgress.solvedChallengeIds.length}</p><p className="mt-1 text-sm text-violet-800">Solved challenges</p></div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-3xl font-bold tracking-tight text-amber-900">{arenaProgress.points}</p><p className="mt-1 text-sm text-amber-800">Arena points</p></div></div><Link to="/code-arena" className="mt-4 inline-flex min-h-10 items-center font-semibold text-violet-700 hover:text-violet-900">Explore Code Arena →</Link>{own && <p className="mt-1 text-xs text-slate-500">Progress saved in this browser.</p>}</PassportSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PassportSection title="Projects and contributions" eyebrow="Building with others"><div className="mt-5 space-y-3">{projects.length ? projects.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="block rounded-2xl border border-slate-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30 focus:outline-none focus:ring-4 focus:ring-violet-100"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-bold text-slate-900">{project.title}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.status}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p><p className="mt-3 text-xs font-medium text-slate-500">{getProjectMemberRole(project.id, id) ?? 'Contributor'}</p></Link>) : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No project contributions recorded yet.</p>}</div></PassportSection>
        <PassportSection title="Learning and circles" eyebrow="Growing consistently">{enrollments.length ? <div className="mt-5 space-y-3">{enrollments.map((enrollment) => <Link key={enrollment.pathId} to={`/learning/${enrollment.pathId}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-violet-200 focus:outline-none focus:ring-4 focus:ring-violet-100"><div className="flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-900">{getLearningPath(enrollment.pathId)?.title}</span><span className="font-semibold text-violet-700">{enrollment.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${enrollment.progress}%` }} /></div></Link>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No learning paths enrolled yet.</p>}{joinedCircles.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-sm font-bold text-slate-800">Circle participation</p><div className="mt-3 flex flex-wrap gap-2">{joinedCircles.map((circle) => <Link key={circle.id} to={`/circles/${circle.id}`} className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100">{circle.name}</Link>)}</div></div>}</PassportSection>
      </div>

      <PassportSection title="Achievements and activity" eyebrow="Milestones"><div className="mt-5">{achievements.length ? <ul className="grid gap-3 sm:grid-cols-2">{achievements.map((achievement, index) => <li key={`${achievement}-${index}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm" aria-hidden="true">✓</span><span className="text-sm font-semibold leading-6 text-emerald-950">{achievement}</span></li>)}</ul> : <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">No achievements recorded yet. Completed learning, published articles, answers, and solved challenges will appear here.</p>}</div><p className="mt-4 text-xs leading-5 text-slate-500">Achievements are derived from SkillBridge activity and are not verified credentials.</p></PassportSection>
      {own && <p className="rounded-2xl bg-slate-100 px-4 py-3 text-xs leading-5 text-slate-600">Demo passport data is stored in this browser. Public visibility settings apply within SkillBridge.</p>}
    </>}
  </main>
}
