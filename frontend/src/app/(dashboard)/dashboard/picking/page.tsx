import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function PickingPage() {
  return (
    <LogisticsTransactionPage
      code="LT24"
      title="Monitor de ordens de transferencia"
      description="Criacao e confirmacao de OT para picking de entregas no WM do SAP ECC."
      module="SAP ECC - LE-WM"
      columns={logisticsColumns.picking}
      rows={logisticsRows.picking}
      statuses={logisticsStatuses}
      createLabel="Criar OT"
      variant="picking"
      kpis={[
        { label: 'OT abertas', value: '18', tone: 'info' },
        { label: 'Picking parcial', value: '7', tone: 'warn' },
        { label: 'OT confirmadas', value: '8', tone: 'ok' },
        { label: 'Diferencas', value: '3', tone: 'warn' },
      ]}
    />
  )
}
