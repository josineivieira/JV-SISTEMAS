import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function MdfePage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_MDFE"
      title="Manifesto MDF-e"
      description="Manifesto eletronico, CT-es vinculados, vale pedagio e encerramento."
      module="Fiscal - Manifesto"
      columns={logisticsColumns.mdfe}
      rows={logisticsRows.mdfe}
      statuses={logisticsStatuses}
      createLabel="Novo MDF-e"
      variant="mdfe"
      kpis={[
        { label: 'MDF-es abertos', value: '7', tone: 'warn' },
        { label: 'Encerrados hoje', value: '4', tone: 'ok' },
        { label: 'Vale pedagio', value: 'R$ 3,8 mil', tone: 'info' },
        { label: 'Pend. encerramento', value: '2', tone: 'warn' },
      ]}
    />
  )
}
