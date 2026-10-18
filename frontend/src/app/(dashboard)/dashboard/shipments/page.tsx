import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function ShipmentsPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_SHIP"
      title="Transportes rodoviarios"
      description="Planejamento, liberacao, acompanhamento e encerramento de viagens."
      module="Logistica - Transporte"
      columns={logisticsColumns.transportes}
      rows={logisticsRows.transportes}
      statuses={logisticsStatuses}
      createLabel="Novo transporte"
      variant="transport"
      kpis={[
        { label: 'Viagens abertas', value: '18', tone: 'info' },
        { label: 'Em transito', value: '7', tone: 'warn' },
        { label: 'Entregues hoje', value: '4', tone: 'ok' },
        { label: 'Atrasos', value: '1', tone: 'warn' },
      ]}
    />
  )
}
