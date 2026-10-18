import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function IntegrationsPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_EDI"
      title="Integracoes EDI/API"
      description="Mensagens 204/214, XML fiscal, webhooks, tentativas e retorno."
      module="Tecnologia - Integracao"
      columns={logisticsColumns.integracoes}
      rows={logisticsRows.integracoes}
      statuses={logisticsStatuses}
      createLabel="Nova integracao"
      variant="edi"
      kpis={[
        { label: 'Mensagens hoje', value: '126', tone: 'info' },
        { label: 'Recebidas', value: '113', tone: 'ok' },
        { label: 'Falhas', value: '7', tone: 'warn' },
        { label: 'Fila', value: '6', tone: 'warn' },
      ]}
    />
  )
}
