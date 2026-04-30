import ProfileSection from './_components/ProfileSection'
import StatsSection from './_components/StatsSection'
import FloodRiskSection from './_components/FloodRiskSection'
import SeoulPaySection from './_components/SeoulPaySection'
import ReportListSection from './_components/ReportListSection'
import NotificationSettings from './_components/NotificationSettings'

export default function MyPage() {
  return (
    <div className="flex flex-col">
      <ProfileSection />
      <StatsSection />
      <div className="flex flex-col gap-5 p-4">
        <FloodRiskSection />
        <SeoulPaySection />
        <ReportListSection />
        <NotificationSettings />
      </div>
    </div>
  )
}
