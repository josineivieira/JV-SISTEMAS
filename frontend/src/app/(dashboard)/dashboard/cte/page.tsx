import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function CtePage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_CTE"
      title="Emissao de CT-e"
      description="Documento fiscal de transporte, lote SEFAZ, autorizacao e DACTE."
      module="Fiscal - Transporte"
      columns={logisticsColumns.cte}
      rows={logisticsRows.cte}
      statuses={logisticsStatuses}
      createLabel="Novo CT-e"
      variant="cte"
      kpis={[
        { label: 'CT-es autorizados', value: '31', tone: 'ok' },
        { label: 'A transmitir', value: '6', tone: 'warn' },
        { label: 'Rejeitados', value: '2', tone: 'warn' },
        { label: 'Valor fiscal', value: 'R$ 218 mil', tone: 'info' },
      ]}
    />
  )
}
