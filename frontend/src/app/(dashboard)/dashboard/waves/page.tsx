import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function WavesPage() {
  return (
    <LogisticsTransactionPage
      code="VL10A"
      title="Remessas pendentes"
      description="Lista de due list para criar entregas de saida a partir de pedidos SD liberados."
      module="SAP ECC - SD Shipping"
      columns={logisticsColumns.ondas}
      rows={logisticsRows.ondas}
      statuses={logisticsStatuses}
      createLabel="Criar entrega"
      variant="wave"
      kpis={[
        { label: 'Pedidos encontrados', value: '9', tone: 'info' },
        { label: 'Entregas geradas', value: '27', tone: 'ok' },
        { label: 'Bloqueios', value: '2', tone: 'warn' },
      ]}
    />
  )
}
