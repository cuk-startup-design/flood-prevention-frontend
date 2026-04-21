import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">AI 흡연 감지 시스템</h1>
      <div className="flex gap-2">
        <Button>기본 버튼</Button>
        <Button variant="destructive">감지 알람</Button>
        <Button variant="outline">카메라 목록</Button>
        <Button variant="ghost">설정</Button>
        <Button variant="secondary">보조 버튼</Button>
      </div>
    </main>
  )
}
