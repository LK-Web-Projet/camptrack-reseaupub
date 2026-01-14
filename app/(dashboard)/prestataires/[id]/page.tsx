import DetailPrestataire from "@/components/prestataires/DetailPrestataire"

interface PrestaireDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PrestaireDetailPage({ params }: PrestaireDetailPageProps) {
  const { id } = await params

  return (
    <div>
      <DetailPrestataire id={id} />
    </div>
  )
}
