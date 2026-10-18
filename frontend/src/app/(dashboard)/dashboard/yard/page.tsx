import { LogisticsTransactionPage } from '@/components/logistics-transaction-page'
import { logisticsColumns, logisticsRows, logisticsStatuses } from '@/lib/logistics-data'

export default function YardPage() {
  return (
    <LogisticsTransactionPage
      code="VL02N"
      title="Saida de mercadoria da entrega"
      description="Conferencia final da entrega, peso, lacre, documentos e PGI no SAP ECC."
      module="SAP ECC - LE Shipping"
      columns={logisticsColumns.patio}
      rows={logisticsRows.patio}
      statuses={logisticsStatuses}
      createLabel="Registrar PGI"
      variant="yard"
      kpis={[
        { label: 'Prontas PGI', value: '17', tone: 'info' },
        { label: 'Sem picking', value: '5', tone: 'warn' },
        { label: 'PGI feitas', value: '9', tone: 'ok' },
        { label: 'Bloqueio saida', value: '2', tone: 'warn' },
      ]}
    />
  )
}
