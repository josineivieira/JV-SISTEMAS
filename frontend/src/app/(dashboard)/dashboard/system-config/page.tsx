import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function SystemConfigPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_PARAM"
      title="Parametros do sistema"
      description="Customizing operacional, fiscal, integracoes, numeracao e ambientes."
      module="Sistema - Customizing"
      columns={logisticsColumns.parametros}
      rows={logisticsRows.parametros}
      statuses={logisticsStatuses}
      createLabel="Novo parametro"
      variant="config"
      kpis={[
        { label: 'Parametros ativos', value: '42', tone: 'info' },
        { label: 'Pendentes revisao', value: '3', tone: 'warn' },
        { label: 'Integracoes ativas', value: '8', tone: 'ok' },
        { label: 'Ambiente', value: 'HML', tone: 'info' },
      ]}
    />
  )
}
