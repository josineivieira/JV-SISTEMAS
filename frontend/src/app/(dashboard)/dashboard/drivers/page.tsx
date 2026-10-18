import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function DriversPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_MOTOR"
      title="Motoristas"
      description="Cadastro, disponibilidade, documentos e vinculo com viagens."
      module="Logistica - Recursos"
      columns={logisticsColumns.motoristas}
      rows={logisticsRows.motoristas}
      statuses={logisticsStatuses}
      createLabel="Novo motorista"
      variant="driver"
      kpis={[
        { label: 'Motoristas', value: '24', tone: 'info' },
        { label: 'Disponiveis', value: '8', tone: 'ok' },
        { label: 'Em viagem', value: '13', tone: 'warn' },
        { label: 'Doc. vencendo', value: '2', tone: 'warn' },
      ]}
    />
  )
}
