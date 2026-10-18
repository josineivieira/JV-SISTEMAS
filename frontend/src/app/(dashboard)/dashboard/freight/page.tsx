import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function FreightPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_FRETE"
      title="Ordens de frete e coleta"
      description="Cotacao, criacao de ordem, coleta, entrega e faturamento operacional."
      module="Logistica - Frete"
      columns={logisticsColumns.fretes}
      rows={logisticsRows.fretes}
      statuses={logisticsStatuses}
      createLabel="Nova ordem"
      variant="freight"
      kpis={[
        { label: 'Ordens do mes', value: '42', tone: 'info' },
        { label: 'Receita prevista', value: 'R$ 86 mil', tone: 'ok' },
        { label: 'Coletas hoje', value: '9', tone: 'warn' },
        { label: 'A faturar', value: 'R$ 22 mil', tone: 'info' },
      ]}
    />
  )
}
