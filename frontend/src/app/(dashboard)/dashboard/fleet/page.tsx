import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function FleetPage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_FLEET"
      title="Gestao de frota"
      description="Cadastro de veiculos, disponibilidade, quilometragem e manutencao."
      module="Logistica - Frota"
      columns={logisticsColumns.frota}
      rows={logisticsRows.frota}
      statuses={logisticsStatuses}
      createLabel="Novo veiculo"
      variant="fleet"
      kpis={[
        { label: 'Frota total', value: '31', tone: 'info' },
        { label: 'Disponiveis', value: '12', tone: 'ok' },
        { label: 'Em viagem', value: '15', tone: 'warn' },
        { label: 'Manutencao', value: '4', tone: 'warn' },
      ]}
    />
  )
}
