import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function LogisticsBillingPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_BILL"
      title="Faturamento logistico"
      description="Faturas, custos, rateios, comprovantes e financeiro por ordem."
      module="Logistica - Faturamento"
      columns={logisticsColumns.faturamento}
      rows={logisticsRows.faturamento}
      statuses={logisticsStatuses}
      createLabel="Nova fatura"
      variant="billing"
      kpis={[
        { label: 'A faturar', value: 'R$ 112 mil', tone: 'info' },
        { label: 'Liberadas', value: '23', tone: 'ok' },
        { label: 'Pendencias POD', value: '4', tone: 'warn' },
        { label: 'Margem media', value: '18%', tone: 'ok' },
      ]}
    />
  )
}
