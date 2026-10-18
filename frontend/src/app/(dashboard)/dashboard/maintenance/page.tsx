import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function MaintenancePage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_MAINT"
      title="Manutencao de frota"
      description="Ordens preventivas, corretivas, requisicao de pecas e liberacao."
      module="Logistica - Manutencao"
      columns={logisticsColumns.manutencao}
      rows={logisticsRows.manutencao}
      statuses={logisticsStatuses}
      createLabel="Nova ordem"
      variant="maintenance"
      kpis={[
        { label: 'Ordens abertas', value: '8', tone: 'warn' },
        { label: 'Preventivas', value: '5', tone: 'info' },
        { label: 'Corretivas', value: '3', tone: 'warn' },
        { label: 'Custo mes', value: 'R$ 18 mil', tone: 'info' },
      ]}
    />
  )
}
