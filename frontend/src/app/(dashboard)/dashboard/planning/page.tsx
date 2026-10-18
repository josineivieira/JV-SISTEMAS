import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function PlanningPage() {
  return (
    <LogisticsTransactionPage
      code="VL01N"
      title="Criar entrega de saida"
      description="Cria entrega de saida a partir de pedido SD liberado na due list."
      module="SAP ECC - LE Shipping"
      columns={logisticsColumns.ondas}
      rows={logisticsRows.ondas}
      statuses={logisticsStatuses}
      createLabel="Criar entrega"
      variant="planning"
      kpis={[
        { label: 'Pedidos disponiveis', value: '14', tone: 'info' },
        { label: 'Entregas criadas', value: '8', tone: 'ok' },
        { label: 'Bloqueios', value: '3', tone: 'warn' },
        { label: 'Sem estoque', value: '1', tone: 'warn' },
      ]}
    />
  )
}
