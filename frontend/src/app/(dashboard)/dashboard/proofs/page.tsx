import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function ProofsPage() {
  return (
    <LogisticsTransactionPage
      code="VLPOD"
      title="Proof of Delivery"
      description="Confirmacao de POD da entrega, quantidade recebida, diferencas e liberacao para faturamento."
      module="SAP ECC - SD POD"
      columns={logisticsColumns.comprovantes}
      rows={logisticsRows.comprovantes}
      statuses={logisticsStatuses}
      createLabel="Novo comprovante"
      variant="proof"
      kpis={[
        { label: 'PODs recebidos', value: '38', tone: 'ok' },
        { label: 'A validar', value: '9', tone: 'warn' },
        { label: 'Publicados', value: '31', tone: 'info' },
        { label: 'Rejeitados', value: '2', tone: 'warn' },
      ]}
    />
  )
}
