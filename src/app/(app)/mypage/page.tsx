import ProfileSection from './_components/ProfileSection'
import StatsSection from './_components/StatsSection'
import SeoulPaySection from './_components/SeoulPaySection'
import ReportListSection from './_components/ReportListSection'

export default function MyPage() {
  return (
    <div className="flex flex-col">
      <ProfileSection />
      <StatsSection />
      <div className="flex flex-col gap-5 p-4">
        <ReportListSection />
        <SeoulPaySection />
      </div>
    </div>
  )
}
