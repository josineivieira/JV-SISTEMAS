import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function ContainersPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_CONTN"
      title="Containers no destino"
      description="Controle de containers, free time, terminal, processo e destino final."
      module="Logistica - Container"
      columns={logisticsColumns.containers}
      rows={logisticsRows.containers}
      statuses={logisticsStatuses}
      createLabel="Novo container"
      variant="container"
      kpis={[
        { label: 'Containers ativos', value: '26', tone: 'info' },
        { label: 'Free time critico', value: '3', tone: 'warn' },
        { label: 'Liberados', value: '11', tone: 'ok' },
        { label: 'No terminal', value: '8', tone: 'info' },
      ]}
    />
  )
}
