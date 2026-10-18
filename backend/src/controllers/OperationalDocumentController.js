const { OperationalDocument, Product, Client, Contract, Sale, SaleItem, Receivable, Payable } = require('../models');
const { sequelize } = require('../config/database');
const inventoryService = require('../services/InventoryService');

const rootTransactions = new Set([
  'MM01', 'INV01', 'XD01', 'PR01', 'XK01', 'VEIC01', 'MOT01', 'ROT01',
  'FI01', 'FI02', 'SU01', 'PAR01', 'INT01', 'LOG01'
]);

const requiredPredecessor = {
  ME21N: ['XK01'], ME22N: ['ME21N'], ME23N: ['ME21N', 'ME22N'], MIGO: ['RC03'], MIRO: ['RC04', 'RC05'],
  RC01: ['ME21N', 'ME22N'], RC02: ['RC01'], RC03: ['RC02'], RC04: ['MIGO'], RC05: ['RC04'], RC07: ['RC05'], RC08: ['RC03'], RC09: ['RC04'],
  CT01: ['XD01'], VA01: ['CT01', 'XD01'], CR01: ['VA01'], CR02: ['CR01'],
  VL10A: ['CR02', 'VA01'], VL01N: ['VL10A'], VL02N: ['VL01N'], VL03N: ['VL01N', 'VL02N'],
  LT03: ['VL01N', 'VL02N'], LT04: ['LT03'], LT12: ['LT03', 'LT04'], CF01: ['LT12'], CF02: ['CF01'],
  CG01: ['CF01'], CG02: ['CG01'], CG03: ['CG01', 'CG02'], ENT01: ['CG01', 'CG02'], ENT02: ['ENT01'],
  VIA01: ['CG01', 'CG02'], VIA02: ['VIA01'], VIA03: ['VIA01', 'VIA02'], GPS01: ['VIA01', 'VIA02'],
  OCR01: ['VIA01', 'ENT01'], CMP01: ['ENT01'], CMP02: ['CMP01'],
  NF01: ['CG01', 'CG02'], NF02: ['NF01'], NF03: ['NF01'], CTE01: ['NF01'], CTE02: ['CTE01'], CTE03: ['CTE01'],
  MDF01: ['CTE01'], MDF02: ['MDF01'], MDF03: ['MDF01'], CIOT01: ['MDF01'], CIOT02: ['CIOT01'],
  FI04: ['FI01'], FI05: ['FI02'], FI06: ['FI01'], FI07: ['FI06'], FI08: ['FI01'], FI09: ['FI02']
};

const clean = (value) => String(value || '').trim().toUpperCase();
const requiredData = {
  MM01: ['materialCode', 'materialDescription', 'unit', 'costPrice', 'salePrice'],
  XD01: ['name', 'taxId'], XK01: ['supplierName', 'taxId'], ME21N: ['materialCode', 'quantity', 'unitPrice'],
  RC01: ['appointmentDate'], RC02: ['plate', 'driver'], RC03: ['receivedQuantity'], RC04: ['invoiceNumber'],
  RC05: ['materialCode', 'quantity', 'plant', 'storageLocation'], VA01: ['materialCode', 'quantity', 'unitPrice'],
  CR02: ['materialCode', 'quantity', 'plant', 'storageLocation'], VL01N: ['shippingPoint'], LT03: ['storageLocation'],
  CF01: ['checkedQuantity'], CG01: ['materialCode', 'quantity', 'plant', 'storageLocation'],
  NF01: ['invoiceNumber', 'amount'], CTE01: ['cteKey'], MDF01: ['mdfeKey'], CIOT01: ['ciotNumber']
};

class OperationalDocumentController {
  async index(req, res) {
    try {
      const where = { companyId: req.user.companyId, isActive: true };
      if (req.query.transactionCode && req.query.all !== 'true') where.transactionCode = clean(req.query.transactionCode);
      if (req.query.module && req.query.all !== 'true') where.module = req.query.module;
      if (req.query.originDocumentId) where.originDocumentId = req.query.originDocumentId;
      const documents = await OperationalDocument.findAll({ where, order: [['updatedAt', 'DESC']] });
      res.json({ documents });
    } catch (error) {
      console.error('List operational documents error:', error);
      res.status(500).json({ error: 'Erro ao listar documentos operacionais' });
    }
  }

  async origins(req, res) {
    try {
      const documents = await OperationalDocument.findAll({
        where: { companyId: req.user.companyId, isActive: true },
        attributes: ['id', 'documentNumber', 'transactionCode', 'title', 'status', 'partner', 'reference', 'data'],
        order: [['updatedAt', 'DESC']],
        limit: 200
      });
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar documentos de origem' });
    }
  }

  async create(req, res) {
    const dbTransaction = await sequelize.transaction();
    try {
      const transactionCode = clean(req.body.transactionCode);
      if (!transactionCode || !req.body.module || !req.body.title) {
        await dbTransaction.rollback();
        return res.status(400).json({ error: 'Transacao, modulo e titulo sao obrigatorios' });
      }
      if (!rootTransactions.has(transactionCode) && !req.body.originDocumentId) {
        await dbTransaction.rollback();
        return res.status(400).json({ error: 'Documento de origem obrigatorio para esta transacao' });
      }

      let origin = null;
      if (req.body.originDocumentId) {
        origin = await OperationalDocument.findOne({
          where: { id: req.body.originDocumentId, companyId: req.user.companyId, isActive: true }, transaction: dbTransaction
        });
        if (!origin) { await dbTransaction.rollback(); return res.status(400).json({ error: 'Documento de origem invalido' }); }
        const allowedOrigins = requiredPredecessor[transactionCode];
        if (allowedOrigins && !allowedOrigins.includes(origin.transactionCode)) {
          await dbTransaction.rollback();
          return res.status(400).json({
            error: `${transactionCode} exige origem ${allowedOrigins.join(' ou ')}; recebido ${origin.transactionCode}`
          });
        }
      }

      const documentData = { ...(origin?.data || {}), ...(req.body.data || {}), originDocumentNumber: origin?.documentNumber || null };
      const missingFields = (requiredData[transactionCode] || []).filter((field) => documentData[field] === undefined || documentData[field] === '');
      if (missingFields.length) {
        await dbTransaction.rollback();
        return res.status(400).json({ error: `Campos obrigatorios: ${missingFields.join(', ')}` });
      }

      const count = await OperationalDocument.count({ where: { companyId: req.user.companyId, transactionCode }, transaction: dbTransaction });
      const documentNumber = `${transactionCode}-${String(count + 1).padStart(8, '0')}`;
      const linkedDocumentIds = [...new Set(req.body.linkedDocumentIds || [])];
      if (documentData.materialCode) {
        const materialDocuments = await OperationalDocument.findAll({
          where: { companyId: req.user.companyId, transactionCode: 'MM01', isActive: true }, transaction: dbTransaction
        });
        const materialDocument = materialDocuments.find((item) => item.data?.materialCode === documentData.materialCode);
        if (materialDocument) linkedDocumentIds.push(materialDocument.id);
      }
      const event = {
        at: new Date(), user: req.user.name, action: 'CRIACAO', transactionCode,
        details: origin ? `Criado a partir de ${origin.documentNumber}` : 'Documento raiz'
      };
      const document = await OperationalDocument.create({
        companyId: req.user.companyId,
        originDocumentId: origin?.id || null,
        linkedDocumentIds: [...new Set(linkedDocumentIds)],
        transactionCode,
        documentNumber,
        module: req.body.module,
        title: req.body.title,
        partner: req.body.partner || origin?.partner,
        reference: req.body.reference || origin?.documentNumber,
        status: req.body.status || 'Criado',
        data: documentData,
        history: [event]
      }, { transaction: dbTransaction });

      const enrichedData = await this.applyBusinessEffects(document, documentData, req.user, dbTransaction);
      await inventoryService.post(document, enrichedData, req.user.name, dbTransaction);
      if (enrichedData !== documentData) await document.update({ data: enrichedData }, { transaction: dbTransaction });
      await dbTransaction.commit();
      res.status(201).json(document);
    } catch (error) {
      if (!dbTransaction.finished) await dbTransaction.rollback();
      console.error('Create operational document error:', error);
      res.status(400).json({ error: error.message || 'Erro ao criar documento operacional' });
    }
  }

  async applyBusinessEffects(document, data, user, transaction) {
    const code = document.transactionCode;
    const enriched = { ...data };
    if (code === 'MM01') {
      const [product] = await Product.findOrCreate({
        where: { companyId: document.companyId, code: data.materialCode },
        defaults: {
          companyId: document.companyId, code: data.materialCode, name: data.materialDescription,
          description: data.materialDescription, category: data.category || 'Material',
          costPrice: Number(data.costPrice), salePrice: Number(data.salePrice), unit: data.unit || 'UN', stockQuantity: 0
        }, transaction
      });
      enriched.entityId = product.id;
    }
    if (code === 'XD01') {
      const [client] = await Client.findOrCreate({
        where: { companyId: document.companyId, cpfCnpj: data.taxId },
        defaults: {
          companyId: document.companyId, name: data.name, cpfCnpj: data.taxId, email: data.email,
          phone: data.phone, address: data.address, city: data.city, state: data.state
        }, transaction
      });
      enriched.entityId = client.id;
    }
    if (code === 'CT01') {
      const contract = await Contract.create({
        companyId: document.companyId, clientName: document.partner || data.name || 'Cliente',
        title: data.contractTitle || document.title, amount: Number(data.amount || 0),
        recurrence: data.recurrence || 'monthly', nextBillingDate: data.validFrom || null,
        notes: `Origem ${document.reference}`
      }, { transaction });
      enriched.entityId = contract.id;
    }
    if (code === 'VA01') {
      const product = await Product.findOne({ where: { companyId: document.companyId, code: data.materialCode, isActive: true }, transaction });
      if (!product) throw new Error(`Material ${data.materialCode} nao cadastrado em MM01`);
      const client = await Client.findOne({ where: { companyId: document.companyId, isActive: true, ...(document.partner ? { name: document.partner } : {}) }, transaction });
      if (!client) throw new Error('Cliente do pedido nao encontrado em XD01');
      const quantity = Number(data.quantity);
      const unitPrice = Number(data.unitPrice);
      const total = quantity * unitPrice;
      const sale = await Sale.create({
        companyId: document.companyId, clientId: client.id, userId: user.id,
        saleNumber: document.documentNumber, status: 'pending', paymentStatus: 'pending',
        subtotal: total, discount: 0, tax: Number(data.tax || 0), total: total + Number(data.tax || 0), notes: `Fluxo ${document.id}`
      }, { transaction });
      await SaleItem.create({ saleId: sale.id, productId: product.id, quantity, unitPrice, discount: 0, total }, { transaction });
      enriched.entityId = sale.id;
      enriched.amount = total;
    }
    if (code === 'NF01') {
      const client = await Client.findOne({ where: { companyId: document.companyId, isActive: true, ...(document.partner ? { name: document.partner } : {}) }, transaction });
      const receivable = await Receivable.create({
        companyId: document.companyId, clientId: client?.id || null,
        description: `NF-e ${data.invoiceNumber}`, amount: Number(data.amount),
        dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000), status: 'pending',
        notes: `Documento operacional ${document.documentNumber}`
      }, { transaction });
      enriched.financialDocumentId = receivable.id;
    }
    if (code === 'MIRO') {
      const payable = await Payable.create({
        companyId: document.companyId, description: `Fatura fornecedor ${data.invoiceNumber || document.documentNumber}`,
        supplier: document.partner, amount: Number(data.amount || 0), dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000),
        status: 'pending', notes: `Origem ${document.reference}`
      }, { transaction });
      enriched.financialDocumentId = payable.id;
    }
    return enriched;
  }

  async update(req, res) {
    try {
      const document = await OperationalDocument.findOne({
        where: { id: req.params.id, companyId: req.user.companyId, isActive: true }
      });
      if (!document) return res.status(404).json({ error: 'Documento nao encontrado' });
      const patch = {};
      for (const field of ['status', 'partner', 'reference', 'data']) {
        if (req.body[field] !== undefined) patch[field] = req.body[field];
      }
      patch.history = [...(document.history || []), {
        at: new Date(), user: req.user.name, action: 'ALTERACAO',
        transactionCode: document.transactionCode,
        details: req.body.note || `Status: ${req.body.status || document.status}`
      }];
      await document.update(patch);
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar documento operacional' });
    }
  }

  async archive(req, res) {
    try {
      const document = await OperationalDocument.findOne({
        where: { id: req.params.id, companyId: req.user.companyId, isActive: true }
      });
      if (!document) return res.status(404).json({ error: 'Documento nao encontrado' });
      const children = await OperationalDocument.count({ where: { originDocumentId: document.id, isActive: true } });
      if (children > 0) return res.status(409).json({ error: 'Documento possui documentos subsequentes e nao pode ser inativado' });
      await document.update({
        isActive: false,
        status: 'Inativo',
        history: [...(document.history || []), {
          at: new Date(), user: req.user.name, action: 'INATIVACAO',
          transactionCode: document.transactionCode, details: 'Exclusao logica'
        }]
      });
      res.json({ message: 'Documento inativado sem exclusao fisica' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao inativar documento' });
    }
  }

  async trace(req, res) {
    try {
      const companyId = req.user.companyId;
      const all = await OperationalDocument.findAll({ where: { companyId } });
      const byId = new Map(all.map((item) => [item.id, item]));
      const start = byId.get(req.params.id);
      if (!start) return res.status(404).json({ error: 'Documento nao encontrado' });
      const adjacency = new Map(all.map((item) => [item.id, new Set()]));
      for (const item of all) {
        const related = [item.originDocumentId, ...(item.linkedDocumentIds || [])].filter(Boolean);
        for (const relatedId of related) {
          if (!adjacency.has(relatedId)) continue;
          adjacency.get(item.id).add(relatedId);
          adjacency.get(relatedId).add(item.id);
        }
      }
      const seen = new Set();
      const queue = [start.id];
      while (queue.length) {
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        for (const linkedId of adjacency.get(id) || []) if (!seen.has(linkedId)) queue.push(linkedId);
      }
      const documents = [...seen].map((id) => byId.get(id)).filter(Boolean).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      res.json({ root: documents[0], documents });
    } catch (error) {
      console.error('Trace operational documents error:', error);
      res.status(500).json({ error: 'Erro ao montar rastreabilidade' });
    }
  }
}

module.exports = new OperationalDocumentController();
