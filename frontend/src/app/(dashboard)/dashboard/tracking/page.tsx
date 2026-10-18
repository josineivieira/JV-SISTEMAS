import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function TrackingPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_TRACK"
      title="Torre de controle"
      description="Eventos operacionais, ocorrencias, rastreamento e alertas de SLA."
      module="Logistica - Monitoramento"
      columns={logisticsColumns.tracking}
      rows={logisticsRows.tracking}
      statuses={logisticsStatuses}
      createLabel="Novo evento"
      variant="tracking"
      kpis={[
        { label: 'Eventos hoje', value: '73', tone: 'info' },
        { label: 'Alertas SLA', value: '5', tone: 'warn' },
        { label: 'Normalizados', value: '18', tone: 'ok' },
        { label: 'Ocorrencias abertas', value: '7', tone: 'warn' },
      ]}
    />
  )
}
