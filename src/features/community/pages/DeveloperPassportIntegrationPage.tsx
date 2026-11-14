import { useParams } from 'react-router-dom'
import { COMMUNITY_USER_ID } from '../../../services/communityService'
import { PassportContributionPanel } from '../components/PassportContributionPanel'
import { DeveloperPassportPage } from './DeveloperPassportPage'
import { ProfileSummaryCard } from '../../profile/components/ProfileSummaryCard'

export function DeveloperPassportIntegrationPage() {
  const { developerId } = useParams()
  return <>
    <ProfileSummaryCard userId={developerId} self={!developerId} />
    <DeveloperPassportPage />
    <div className="mx-auto mt-6 max-w-6xl">
      <PassportContributionPanel userId={developerId ?? COMMUNITY_USER_ID} isCurrentUser={!developerId} />
    </div>
  </>
}
