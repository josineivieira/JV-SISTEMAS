import { notFound } from 'next/navigation'
import { ErpTransactionPage } from '@/components/erp-transaction-page'
import { transactionByCode } from '@/lib/erp-transactions'

export default function TransactionPage({ params }: { params: { code: string } }) {
  const transaction = transactionByCode[params.code.toUpperCase()]
  if (!transaction) notFound()
  return <ErpTransactionPage transaction={transaction} />
}
