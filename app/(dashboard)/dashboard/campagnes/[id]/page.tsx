import DetailCampagne from "@/components/campagnes/DetailCampagne"
interface PrestaireDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PrestaireDetailPage({ params }: PrestaireDetailPageProps) {
  const { id } = await params

  return (
    <div>
      <DetailCampagne id={id} />
    </div>
  )
}
