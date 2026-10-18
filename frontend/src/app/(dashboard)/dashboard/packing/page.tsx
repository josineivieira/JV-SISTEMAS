import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function PackingPage() {
  return (
    <LogisticsTransactionPage
      code="VL02N"
      title="Embalagem e alteracao da entrega"
      description="Packing, volumes, peso, lacre e dados de picking dentro da entrega de saida."
      module="SAP ECC - LE Shipping"
      columns={logisticsColumns.packing}
      rows={logisticsRows.packing}
      statuses={logisticsStatuses}
      createLabel="Registrar volume"
      variant="packing"
      kpis={[
        { label: 'Volumes abertos', value: '12', tone: 'info' },
        { label: 'Entregas prontas', value: '7', tone: 'ok' },
        { label: 'Sem lacre', value: '3', tone: 'warn' },
        { label: 'Bloqueadas', value: '1', tone: 'warn' },
      ]}
    />
  )
}
