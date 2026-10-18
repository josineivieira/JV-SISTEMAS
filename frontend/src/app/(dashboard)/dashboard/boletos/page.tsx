import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function BoletosPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_BOLETO"
      title="Boletos e cobrancas"
      description="Geracao de boleto, vencimento, baixa, conciliacao e conta cliente."
      module="Financeiro - Cobranca"
      columns={logisticsColumns.boletos}
      rows={logisticsRows.boletos}
      statuses={logisticsStatuses}
      createLabel="Novo boleto"
      variant="boleto"
      kpis={[
        { label: 'Boletos emitidos', value: '44', tone: 'info' },
        { label: 'Pagos', value: '28', tone: 'ok' },
        { label: 'Vencidos', value: '5', tone: 'warn' },
        { label: 'A receber', value: 'R$ 66 mil', tone: 'info' },
      ]}
    />
  )
}
