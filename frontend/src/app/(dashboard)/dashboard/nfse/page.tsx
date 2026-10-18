import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function NfsePage() {
  return (
    <LogisticsTransactionPage
      code="ZJV_NFSE"
      title="Emissao de NFS-e"
      description="RPS, autorizacao municipal simulada, PDF, XML e cancelamento."
      module="Fiscal - Servicos"
      columns={logisticsColumns.nfse}
      rows={logisticsRows.nfse}
      statuses={logisticsStatuses}
      createLabel="Novo RPS"
      variant="nfse"
      kpis={[
        { label: 'NFS-e emitidas', value: '18', tone: 'ok' },
        { label: 'RPS pendentes', value: '3', tone: 'warn' },
        { label: 'Valor mes', value: 'R$ 94 mil', tone: 'info' },
        { label: 'Rejeicoes', value: '1', tone: 'warn' },
      ]}
    />
  )
}
