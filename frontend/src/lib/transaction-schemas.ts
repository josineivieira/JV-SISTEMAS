export type TransactionField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select'
  required?: boolean
  options?: string[]
  wide?: boolean
}

const field = (key: string, label: string, required = false, type: TransactionField['type'] = 'text', options?: string[]): TransactionField => ({ key, label, required, type, options })

const material = [field('materialCode', 'Material', true), field('materialDescription', 'Descricao'), field('quantity', 'Quantidade', true, 'number'), field('unit', 'Unidade', true, 'select', ['UN', 'KG', 'L', 'CX', 'PAL'])]
const location = [field('plant', 'Centro', true), field('storageLocation', 'Deposito', true)]

export const transactionSchemas: Record<string, TransactionField[]> = {
  XK01: [field('supplierName', 'Razao social', true), field('taxId', 'CNPJ/CPF', true), field('email', 'E-mail'), field('phone', 'Telefone'), field('address', 'Endereco')],
  ME21N: [field('supplierName', 'Fornecedor', true), ...material, field('unitPrice', 'Preco unitario', true, 'number'), ...location, field('deliveryDate', 'Data entrega', true, 'date')],
  ME22N: [field('quantity', 'Nova quantidade', true, 'number'), field('unitPrice', 'Novo preco', true, 'number'), field('deliveryDate', 'Nova entrega', true, 'date')],
  MIGO: [...material, ...location, field('batch', 'Lote'), field('invoiceNumber', 'Nota fornecedor')],
  MIRO: [field('invoiceNumber', 'Fatura fornecedor', true), field('amount', 'Valor', true, 'number'), field('dueDate', 'Vencimento', true, 'date')],
  RC01: [field('appointmentDate', 'Data agendada', true, 'date'), field('appointmentTime', 'Hora', true), field('dock', 'Doca'), field('carrier', 'Transportadora')],
  RC02: [field('plate', 'Placa', true), field('driver', 'Motorista', true), field('arrivalDate', 'Chegada', true, 'date'), field('dock', 'Doca', true)],
  RC03: [...material, field('receivedQuantity', 'Quantidade conferida', true, 'number'), field('batch', 'Lote'), field('divergence', 'Divergencia')],
  RC04: [field('invoiceNumber', 'Numero NF', true), field('invoiceKey', 'Chave NF-e', true), field('amount', 'Valor total', true, 'number')],
  RC05: [...material, ...location, field('addressBin', 'Endereco WM', true), field('batch', 'Lote')],
  MM01: [field('materialCode', 'Codigo material', true), field('materialDescription', 'Descricao', true), field('category', 'Grupo mercadoria'), field('unit', 'Unidade', true, 'select', ['UN', 'KG', 'L', 'CX', 'PAL']), field('costPrice', 'Preco custo', true, 'number'), field('salePrice', 'Preco venda', true, 'number'), ...location, field('quantity', 'Estoque inicial', false, 'number')],
  MB52: [field('materialCode', 'Material'), field('materialDescription', 'Descricao'), ...location, field('unrestricted', 'Livre utilizacao'), field('reserved', 'Reservado'), field('blocked', 'Bloqueado'), field('unit', 'UM')],
  MB51: [field('materialCode', 'Material'), field('movementType', 'Tipo movimento'), field('quantity', 'Quantidade'), ...location, field('documentNumber', 'Documento origem'), field('userName', 'Usuario')],
  INV01: [...location, field('countDate', 'Data contagem', true, 'date'), field('counter', 'Responsavel', true)],
  INV02: [...material, ...location, field('adjustmentQuantity', 'Diferenca (+/-)', true, 'number'), field('reason', 'Motivo', true)],
  TR01: [...material, ...location, field('destinationStorageLocation', 'Deposito destino', true)],
  TR02: [...material, ...location, field('destinationPlant', 'Centro destino', true), field('destinationStorageLocation', 'Deposito destino', true)],
  BL01: [...material, ...location, field('reason', 'Motivo bloqueio', true)], BL02: [...material, ...location, field('reason', 'Motivo desbloqueio', true)],
  DV01: [...material, ...location, field('reason', 'Motivo devolucao', true)],
  XD01: [field('name', 'Razao social / Nome', true), field('taxId', 'CNPJ/CPF', true), field('email', 'E-mail'), field('phone', 'Telefone'), field('address', 'Endereco'), field('city', 'Cidade'), field('state', 'UF')],
  CT01: [field('contractTitle', 'Objeto contrato', true), field('amount', 'Valor', true, 'number'), field('recurrence', 'Recorrencia', true, 'select', ['monthly', 'quarterly', 'yearly', 'one_time']), field('validFrom', 'Inicio vigencia', true, 'date')],
  VA01: [field('materialCode', 'Material', true), field('quantity', 'Quantidade', true, 'number'), field('unitPrice', 'Preco unitario', true, 'number'), field('tax', 'Impostos', false, 'number'), ...location, field('requestedDate', 'Data solicitada', true, 'date')],
  CR01: [field('creditLimit', 'Limite credito', true, 'number'), field('openAmount', 'Exposicao atual', true, 'number'), field('analysis', 'Parecer', true)],
  CR02: [...material, ...location, field('approval', 'Decisao', true, 'select', ['Aprovado', 'Rejeitado'])],
  VL01N: [field('shippingPoint', 'Ponto expedicao', true), field('route', 'Rota', true), field('deliveryDate', 'Data remessa', true, 'date')],
  LT03: [...material, ...location, field('sourceBin', 'Posicao origem', true), field('destinationBin', 'Area staging', true)],
  LT12: [field('confirmedQuantity', 'Quantidade confirmada', true, 'number'), field('operator', 'Operador', true)],
  CF01: [field('checkedQuantity', 'Quantidade conferida', true, 'number'), field('checker', 'Conferente', true), field('seal', 'Lacre')],
  CG01: [...material, ...location, field('plate', 'Placa', true), field('driver', 'Motorista', true), field('dock', 'Doca', true), field('seal', 'Lacre', true)],
  ENT01: [field('deliveryDate', 'Data entrega', true, 'date'), field('receiver', 'Recebedor', true), field('document', 'Documento recebedor')],
  ROT01: [field('routeCode', 'Codigo rota', true), field('origin', 'Origem', true), field('destination', 'Destino', true), field('distance', 'Distancia km', true, 'number')],
  VEIC01: [field('plate', 'Placa', true), field('model', 'Modelo', true), field('capacity', 'Capacidade kg', true, 'number'), field('vehicleType', 'Tipo veiculo', true)],
  MOT01: [field('driverName', 'Motorista', true), field('cpf', 'CPF', true), field('license', 'CNH', true), field('licenseCategory', 'Categoria', true)],
  VIA01: [field('routeCode', 'Rota', true), field('plate', 'Veiculo', true), field('driverName', 'Motorista', true), field('departureDate', 'Saida prevista', true, 'date')],
  CMP01: [field('receiver', 'Recebedor', true), field('receivedAt', 'Data recebimento', true, 'date'), field('proofNumber', 'Comprovante', true)],
  NF01: [field('invoiceNumber', 'Numero NF-e', true), field('invoiceKey', 'Chave acesso', true), field('amount', 'Valor', true, 'number'), field('dueDate', 'Vencimento', true, 'date')],
  CTE01: [field('cteNumber', 'Numero CT-e', true), field('cteKey', 'Chave CT-e', true), field('freightValue', 'Valor frete', true, 'number')],
  MDF01: [field('mdfeNumber', 'Numero MDF-e', true), field('mdfeKey', 'Chave MDF-e', true), field('plate', 'Placa', true)],
  CIOT01: [field('ciotNumber', 'Numero CIOT', true), field('contractorTaxId', 'CNPJ contratante', true), field('freightValue', 'Valor frete', true, 'number')],
}

const defaultByModule: Record<string, TransactionField[]> = {
  Recebimento: [...material, ...location], Estoque: [...material, ...location], Compras: [...material, field('amount', 'Valor', false, 'number')],
  Comercial: [field('reference', 'Referencia'), field('amount', 'Valor', false, 'number')],
  Expedicao: [...material, ...location], Transporte: [field('routeCode', 'Rota'), field('plate', 'Placa'), field('driverName', 'Motorista')],
  Fiscal: [field('fiscalDocument', 'Documento fiscal', true), field('amount', 'Valor', false, 'number')],
  Financeiro: [field('amount', 'Valor', true, 'number'), field('dueDate', 'Vencimento', false, 'date')],
}

export const getTransactionFields = (code: string, module: string) => transactionSchemas[code] || defaultByModule[module] || [field('description', 'Descricao', true)]
