import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function LogisticsReportsPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_REP"
      title="Relatorios logisticos"
      description="OTIF, SLA, custo por KM, produtividade e desvios operacionais."
      module="Logistica - Reporting"
      columns={logisticsColumns.relatorios}
      rows={logisticsRows.relatorios}
      statuses={logisticsStatuses}
      createLabel="Novo indicador"
      variant="report"
      kpis={[
        { label: 'OTIF', value: '94,2%', tone: 'warn' },
        { label: 'SLA torre', value: '97%', tone: 'ok' },
        { label: 'Custo/KM', value: 'R$ 5,83', tone: 'ok' },
        { label: 'Desvios', value: '11', tone: 'warn' },
      ]}
    />
  )
}
