export type TransactionMode = 'create' | 'change' | 'display' | 'list' | 'process' | 'monitor'

export type ErpTransaction = {
  code: string
  title: string
  module: string
  mode: TransactionMode
  phase: string
  requiresOrigin: boolean
}

const tx = (
  module: string,
  phase: string,
  requiresOrigin: boolean,
  entries: Array<[string, string, TransactionMode]>
): ErpTransaction[] => entries.map(([code, title, mode]) => ({ code, title, module, mode, phase, requiresOrigin }))

export const erpTransactions: ErpTransaction[] = [
  ...tx('Compras', 'Fornecedores', false, [['XK01', 'Cadastrar Fornecedor', 'create']]),
  ...tx('Compras', 'Pedidos de compra', true, [
    ['ME21N', 'Criar Pedido de Compra', 'create'], ['ME22N', 'Alterar Pedido de Compra', 'change'],
    ['ME23N', 'Exibir Pedido de Compra', 'display'], ['MIGO', 'Entrada de Mercadoria', 'process'], ['MIRO', 'Fatura do Fornecedor', 'process'],
  ]),
  ...tx('Recebimento', 'Agendamento', true, [['RC01', 'Agendamento Recebimento', 'create']]),
  ...tx('Recebimento', 'Recebimento', true, [
    ['RC02', 'Chegada Veiculo', 'process'], ['RC03', 'Conferencia Recebimento', 'process'],
    ['RC04', 'Entrada NF', 'process'], ['RC05', 'Enderecamento', 'process'],
    ['RC06', 'Consulta Recebimentos', 'list'], ['RC07', 'Historico Recebimentos', 'list'],
    ['RC08', 'Divergencias Recebimento', 'process'], ['RC09', 'Devolucao Fornecedor', 'process'],
  ]),
  ...tx('Estoque', 'Material', false, [['MM01', 'Cadastro Material', 'create'], ['INV01', 'Inventario', 'create']]),
  ...tx('Estoque', 'Estoque', true, [
    ['MM02', 'Alterar Material', 'change'], ['MM03', 'Consultar Material', 'display'],
    ['MB51', 'Movimentacoes', 'list'], ['MB52', 'Consulta Estoque', 'list'],
    ['INV02', 'Ajuste Inventario', 'process'], ['TR01', 'Transferencia Interna', 'process'],
    ['TR02', 'Transferencia Depositos', 'process'], ['BL01', 'Bloqueio Estoque', 'process'],
    ['BL02', 'Desbloqueio Estoque', 'process'], ['DV01', 'Devolucao Estoque', 'process'],
  ]),
  ...tx('Comercial', 'Cliente', false, [['XD01', 'Criar Cliente', 'create'], ['PR01', 'Tabela Precos', 'create']]),
  ...tx('Comercial', 'Comercial', true, [
    ['XD02', 'Alterar Cliente', 'change'], ['XD03', 'Exibir Cliente', 'display'], ['XD05', 'Consulta Clientes', 'list'],
    ['CT01', 'Criar Contrato', 'create'], ['CT02', 'Alterar Contrato', 'change'], ['CT03', 'Consultar Contrato', 'display'],
    ['VA01', 'Criar Pedido', 'create'], ['VA02', 'Alterar Pedido', 'change'], ['VA03', 'Exibir Pedido', 'display'],
    ['VA05', 'Lista Pedidos', 'list'], ['CR01', 'Analise Credito', 'process'], ['CR02', 'Aprovacao Credito', 'process'],
    ['PR02', 'Promocoes', 'process'],
  ]),
  ...tx('Expedicao', 'Expedicao', true, [
    ['VL10A', 'Remessas Pendentes', 'list'], ['VL01N', 'Criar Remessa', 'create'], ['VL02N', 'Alterar Remessa', 'change'],
    ['VL03N', 'Exibir Remessa', 'display'], ['LT03', 'Criar Picking', 'create'], ['LT04', 'Alterar Picking', 'change'],
    ['LT12', 'Confirmar Picking', 'process'], ['CF01', 'Conferencia Expedicao', 'process'],
    ['CF02', 'Divergencias Expedicao', 'process'], ['CG01', 'Carregamento', 'create'],
    ['CG02', 'Alterar Carregamento', 'change'], ['CG03', 'Consultar Carregamento', 'display'],
    ['ENT01', 'Entregas', 'list'], ['ENT02', 'Ocorrencias Entrega', 'process'],
  ]),
  ...tx('Transporte', 'Transporte', false, [
    ['VEIC01', 'Cadastro Veiculos', 'create'], ['MOT01', 'Cadastro Motoristas', 'create'], ['ROT01', 'Cadastro Rotas', 'create'],
  ]),
  ...tx('Transporte', 'Transporte', true, [
    ['VEIC02', 'Alterar Veiculos', 'change'], ['VEIC03', 'Consulta Veiculos', 'display'],
    ['MOT02', 'Alterar Motoristas', 'change'], ['MOT03', 'Consulta Motoristas', 'display'],
    ['ROT02', 'Alterar Rotas', 'change'], ['ROT03', 'Consulta Rotas', 'display'],
    ['VIA01', 'Planejamento Viagem', 'create'], ['VIA02', 'Alterar Viagem', 'change'], ['VIA03', 'Consulta Viagem', 'display'],
    ['GPS01', 'Rastreamento Viagem', 'monitor'], ['CMP01', 'Comprovantes', 'create'],
    ['CMP02', 'Consulta Comprovantes', 'display'], ['OCR01', 'Ocorrencias Transporte', 'process'],
  ]),
  ...tx('Fiscal', 'Fiscal', true, [
    ['NF01', 'Gerar NF-e', 'create'], ['NF02', 'Cancelar NF-e', 'process'], ['NF03', 'Consultar NF-e', 'display'],
    ['CTE01', 'Gerar CT-e', 'create'], ['CTE02', 'Cancelar CT-e', 'process'], ['CTE03', 'Consultar CT-e', 'display'],
    ['MDF01', 'Gerar MDF-e', 'create'], ['MDF02', 'Encerrar MDF-e', 'process'], ['MDF03', 'Consultar MDF-e', 'display'],
    ['CIOT01', 'Gerar CIOT', 'create'], ['CIOT02', 'Consultar CIOT', 'display'],
    ['SEF01', 'Eventos SEFAZ', 'list'], ['SEF02', 'Monitor Fiscal', 'monitor'],
  ]),
  ...tx('Financeiro', 'Financeiro', false, [['FI01', 'Contas Receber', 'list'], ['FI02', 'Contas Pagar', 'list']]),
  ...tx('Financeiro', 'Financeiro', true, [
    ['FI03', 'Fluxo Caixa', 'list'], ['FI04', 'Baixa Recebimento', 'process'], ['FI05', 'Baixa Pagamento', 'process'],
    ['FI06', 'Inadimplencia', 'list'], ['FI07', 'Cobranca', 'process'],
    ['FI08', 'Extrato Cliente', 'list'], ['FI09', 'Extrato Fornecedor', 'list'],
  ]),
  ...tx('Administracao', 'Administracao', false, [
    ['SU01', 'Usuarios', 'list'], ['PAR01', 'Parametros Sistema', 'change'], ['INT01', 'Integracoes', 'change'], ['LOG01', 'Auditoria', 'list'],
  ]),
  ...tx('Administracao', 'Administracao', true, [
    ['SU02', 'Perfis', 'change'], ['SU03', 'Permissoes', 'change'], ['LOG02', 'Historico Alteracoes', 'list'],
    ['INT02', 'Monitor Integracoes', 'monitor'],
  ]),
]

export const transactionByCode = Object.fromEntries(erpTransactions.map((item) => [item.code, item]))

export const transactionPredecessors: Record<string, string[]> = {
  ME21N: ['XK01'], ME22N: ['ME21N'], ME23N: ['ME21N', 'ME22N'], MIGO: ['RC03'], MIRO: ['RC04', 'RC05'],
  RC01: ['ME21N', 'ME22N'],
  RC02: ['RC01'], RC03: ['RC02'], RC04: ['MIGO'], RC05: ['RC04'], RC07: ['RC05'], RC08: ['RC03'], RC09: ['RC04'],
  CT01: ['XD01'], VA01: ['CT01', 'XD01'], CR01: ['VA01'], CR02: ['CR01'],
  VL10A: ['CR02', 'VA01'], VL01N: ['VL10A'], VL02N: ['VL01N'], VL03N: ['VL01N', 'VL02N'],
  LT03: ['VL01N', 'VL02N'], LT04: ['LT03'], LT12: ['LT03', 'LT04'], CF01: ['LT12'], CF02: ['CF01'],
  CG01: ['CF01'], CG02: ['CG01'], CG03: ['CG01', 'CG02'], ENT01: ['CG01', 'CG02'], ENT02: ['ENT01'],
  VIA01: ['CG01', 'CG02'], VIA02: ['VIA01'], VIA03: ['VIA01', 'VIA02'], GPS01: ['VIA01', 'VIA02'],
  OCR01: ['VIA01', 'ENT01'], CMP01: ['ENT01'], CMP02: ['CMP01'],
  NF01: ['CG01', 'CG02'], NF02: ['NF01'], NF03: ['NF01'], CTE01: ['NF01'], CTE02: ['CTE01'], CTE03: ['CTE01'],
  MDF01: ['CTE01'], MDF02: ['MDF01'], MDF03: ['MDF01'], CIOT01: ['MDF01'], CIOT02: ['CIOT01'],
  FI04: ['FI01'], FI05: ['FI02'], FI06: ['FI01'], FI07: ['FI06'], FI08: ['FI01'], FI09: ['FI02'],
}

export const transactionSections: Record<string, string> = {
  XK01: 'Fornecedores', ME21N: 'Pedidos de compra', ME22N: 'Pedidos de compra', ME23N: 'Pedidos de compra', MIGO: 'Entrada mercadoria', MIRO: 'Fatura fornecedor',
  RC01: 'Agendamento', RC02: 'Agendamento', RC03: 'Conferencia', RC08: 'Conferencia', RC04: 'Entrada NF', RC09: 'Entrada NF', RC05: 'Enderecamento', RC06: 'Historico Recebimentos', RC07: 'Historico Recebimentos',
  MM01: 'Materiais', MM02: 'Materiais', MM03: 'Materiais', MB52: 'Consulta Estoque', MB51: 'Movimentacoes', INV01: 'Inventario', INV02: 'Inventario', TR01: 'Transferencias', TR02: 'Transferencias', BL01: 'Bloqueios', BL02: 'Bloqueios', DV01: 'Devolucoes',
  XD01: 'Clientes', XD02: 'Clientes', XD03: 'Clientes', XD05: 'Clientes', CT01: 'Contratos', CT02: 'Contratos', CT03: 'Contratos', VA01: 'Pedidos', VA02: 'Pedidos', VA03: 'Pedidos', VA05: 'Pedidos', CR01: 'Credito', CR02: 'Credito', PR01: 'Precos', PR02: 'Precos',
  VL10A: 'Remessas', VL01N: 'Remessas', VL02N: 'Remessas', VL03N: 'Remessas', LT03: 'Picking', LT04: 'Picking', LT12: 'Picking', CF01: 'Conferencia', CF02: 'Conferencia', CG01: 'Carregamento', CG02: 'Carregamento', CG03: 'Carregamento', ENT01: 'Entregas', ENT02: 'Entregas',
  ROT01: 'Rotas', ROT02: 'Rotas', ROT03: 'Rotas', VEIC01: 'Veiculos', VEIC02: 'Veiculos', VEIC03: 'Veiculos', MOT01: 'Motoristas', MOT02: 'Motoristas', MOT03: 'Motoristas', VIA01: 'Viagens', VIA02: 'Viagens', VIA03: 'Viagens', GPS01: 'Viagens', CMP01: 'Comprovantes', CMP02: 'Comprovantes', OCR01: 'Ocorrencias',
  NF01: 'NF-e', NF02: 'NF-e', NF03: 'NF-e', CTE01: 'CT-e', CTE02: 'CT-e', CTE03: 'CT-e', MDF01: 'MDF-e', MDF02: 'MDF-e', MDF03: 'MDF-e', CIOT01: 'CIOT', CIOT02: 'CIOT', SEF01: 'SEFAZ', SEF02: 'SEFAZ',
}

export const traceabilityFlow = [
  { label: 'Fornecedor', codes: ['XK01'] }, { label: 'Pedido compra', codes: ['ME21N', 'ME22N'] },
  { label: 'Agendamento', codes: ['RC01'] }, { label: 'Chegada', codes: ['RC02'] },
  { label: 'Conf. recebimento', codes: ['RC03'] }, { label: 'MIGO', codes: ['MIGO'] },
  { label: 'Entrada NF', codes: ['RC04'] }, { label: 'Enderecamento', codes: ['RC05'] },
  { label: 'Material/Estoque', codes: ['MM01', 'INV02', 'TR01', 'TR02'] },
  { label: 'Cliente', codes: ['XD01'] }, { label: 'Contrato', codes: ['CT01'] },
  { label: 'Pedido venda', codes: ['VA01'] }, { label: 'Credito', codes: ['CR01', 'CR02'] },
  { label: 'Remessa', codes: ['VL10A', 'VL01N'] }, { label: 'Picking', codes: ['LT03', 'LT12'] },
  { label: 'Conf. expedicao', codes: ['CF01'] }, { label: 'Carregamento', codes: ['CG01'] },
  { label: 'NF-e', codes: ['NF01'] }, { label: 'CT-e', codes: ['CTE01'] },
  { label: 'MDF-e', codes: ['MDF01'] }, { label: 'CIOT', codes: ['CIOT01'] },
  { label: 'Viagem', codes: ['VIA01'] }, { label: 'Entrega', codes: ['ENT01'] },
  { label: 'Comprovante', codes: ['CMP01'] }, { label: 'Financeiro', codes: ['FI01', 'FI02', 'FI04', 'FI05', 'MIRO'] },
]

export const transactionPath = (code: string) => `/dashboard/transactions/${code.toLowerCase()}`
