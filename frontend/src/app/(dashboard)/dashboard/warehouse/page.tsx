import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function WarehousePage() {
  return (
    <LogisticsTransactionPage
      code="VL06O"
      title="Monitor de entregas de saida"
      description="Cockpit ECC para entregas, picking, PGI, bloqueios e documentos subsequentes."
      module="SAP ECC - LE Shipping"
      columns={logisticsColumns.armazem}
      rows={logisticsRows.armazem}
      statuses={logisticsStatuses}
      createLabel="Criar entrega"
      variant="warehouse"
      kpis={[
        { label: 'Entregas abertas', value: '19', tone: 'info' },
        { label: 'Picking pendente', value: '11', tone: 'warn' },
        { label: 'PGI pronto', value: '8', tone: 'ok' },
        { label: 'Bloqueadas', value: '1', tone: 'warn' },
      ]}
    />
  )
}
