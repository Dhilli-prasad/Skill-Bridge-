import type { DeveloperProfile } from '../types/dashboard'

const profile = (id: string, fullName: string, bio: string, skills: string[], interests: string[], joinedAt = '2026-10-01T00:00:00.000Z'): DeveloperProfile => ({
  id,
  fullName,
  username: id,
  bio,
  skills,
  interests,
  joinedAt,
})

export const developerProfiles: DeveloperProfile[] = [
  profile('demo-user-aarav-kumar', 'Aarav Kumar', 'Developer building momentum through focused peer learning.', ['React', 'TypeScript', 'Testing'], ['Developer experience', 'Open source'], '2026-09-15T00:00:00.000Z'),
  profile('maya-patel', 'Maya Patel', 'Frontend engineer and accessibility advocate.', ['React', 'Accessibility', 'Design systems'], ['Inclusive products', 'Frontend architecture']),
  profile('arjun-mehta', 'Arjun Mehta', 'Python learner building practical automation tools.', ['Python', 'Automation', 'CLI'], ['Developer tooling', 'Learning in public']),
  profile('priya-shah', 'Priya Shah', 'Cloud engineer exploring serverless systems.', ['AWS', 'Cloud architecture', 'Observability'], ['Serverless', 'Reliability']),
  profile('rahul-nair', 'Rahul Nair', 'Backend developer learning Spring Boot.', ['Java', 'Spring Boot', 'APIs'], ['Backend systems', 'Testing']),
  profile('nia-williams', 'Nia Williams', 'ML practitioner making concepts approachable.', ['Python', 'Machine learning', 'Data science'], ['Education', 'Responsible AI']),
  profile('sofia-rao', 'Sofia Rao', 'Data storyteller turning analysis into decisions.', ['Data visualization', 'Analytics', 'Python'], ['Data storytelling', 'Product decisions']),
  profile('omar-khan', 'Omar Khan', 'Security-minded developer and code reviewer.', ['Security', 'Threat modeling', 'JavaScript'], ['Application security', 'Code review']),
  profile('sana-iyer', 'Sana Iyer', 'Product-minded TypeScript developer.', ['TypeScript', 'React', 'Testing'], ['Product engineering', 'Developer experience']),
  profile('rohan-das', 'Rohan Das', 'Independent builder contributing in public.', ['GitHub', 'JavaScript', 'Open source'], ['Community', 'Maintainer tooling']),
  profile('meera-joshi', 'Meera Joshi', 'Data analyst growing as a developer.', ['Python', 'SQL', 'Analytics'], ['Career growth', 'Learning plans']),
  profile('jay-shah', 'Jay Shah', 'Frontend engineer focused on inclusive products.', ['CSS', 'Responsive design', 'React'], ['Accessibility', 'Design systems']),
  profile('anika-roy', 'Anika Roy', 'Developer exploring reliable infrastructure.', ['CI/CD', 'DevOps', 'TypeScript'], ['Infrastructure', 'Developer experience']),
]
