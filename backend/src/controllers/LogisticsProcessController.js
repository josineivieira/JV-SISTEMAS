const { LogisticsProcess, Sale, SaleItem, Product, Client, User } = require('../models');
const { Op } = require('sequelize');

const stageOrder = [
  'sales_order',
  'planning',
  'freight_order',
  'wave',
  'picking',
  'packing',
  'expedition',
  'transport',
  'pod',
  'billing'
];

const stageStatus = {
  sales_order: 'Planejado',
  planning: 'Planejado',
  freight_order: 'Liberado',
  wave: 'Liberado',
  picking: 'Separacao',
  packing: 'Conferencia',
  expedition: 'Liberado',
  transport: 'Em transito',
  pod: 'Recebido',
  billing: 'Emitido'
};

class LogisticsProcessController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.advance = this.advance.bind(this);
    this.runAction = this.runAction.bind(this);
    this.update = this.update.bind(this);
  }

  async getAll(req, res) {
    try {
      const companyId = req.user.companyId;
      const { stage, status, saleId, tx } = req.query;
      const where = { companyId };
      if (stage) where.stage = stage;
      if (status) where.status = status;
      if (saleId) where.saleId = saleId;

      if (stage === 'sales_order' && !saleId) {
        const deliveredSaleIds = await LogisticsProcess.findAll({
          where: { companyId, stage: 'wave', saleId: { [Op.ne]: null } },
          attributes: ['saleId'],
          raw: true
        });
        const excludedIds = deliveredSaleIds.map((item) => item.saleId);
        if (excludedIds.length > 0) where.saleId = { [Op.notIn]: excludedIds };
      }

      if (stage === 'wave' && tx === 'LT03' && !saleId) {
        const pickedSaleIds = await LogisticsProcess.findAll({
          where: { companyId, stage: 'picking', saleId: { [Op.ne]: null } },
          attributes: ['saleId'],
          raw: true
        });
        const excludedIds = pickedSaleIds.map((item) => item.saleId);
        if (excludedIds.length > 0) where.saleId = { [Op.notIn]: excludedIds };
      }

      const processes = await LogisticsProcess.findAll({
        where,
        include: [{
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleNumber', 'status', 'total'],
          include: [
            { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
            { model: User, as: 'user', attributes: ['id', 'name'] }
          ]
        }],
        order: [['updatedAt', 'DESC']]
      });

      res.json({ processes });
    } catch (error) {
      console.error('Get logistics processes error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req, res) {
    try {
      const process = await LogisticsProcess.findOne({
        where: { id: req.params.id, companyId: req.user.companyId },
        include: [{ model: Sale, as: 'sale' }]
      });
      if (!process) return res.status(404).json({ error: 'Processo logistico nao encontrado' });
      res.json(process);
    } catch (error) {
      console.error('Get logistics process error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req, res) {
    try {
      const companyId = req.user.companyId;
      const process = await LogisticsProcess.create({
        companyId,
        processNumber: await this.nextProcessNumber(companyId, req.body.stage || 'planning'),
        stage: req.body.stage || 'planning',
        salesOrderNumber: req.body.salesOrderNumber,
        clientName: req.body.clientName || 'Cliente nao informado',
        productSummary: req.body.productSummary,
        weight: req.body.weight,
        deadline: req.body.deadline || null,
        route: req.body.route,
        carrier: req.body.carrier,
        dock: req.body.dock,
        plate: req.body.plate,
        driver: req.body.driver,
        status: req.body.status || stageStatus[req.body.stage] || 'Planejado',
        documents: req.body.documents || {},
        events: [{
          at: new Date(),
          user: req.user.name,
          action: 'Processo criado manualmente'
        }]
      });

      res.status(201).json(process);
    } catch (error) {
      console.error('Create logistics process error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const process = await LogisticsProcess.findOne({
        where: { id: req.params.id, companyId: req.user.companyId }
      });
      if (!process) return res.status(404).json({ error: 'Processo logistico nao encontrado' });

      const allowed = ['route', 'carrier', 'dock', 'plate', 'driver', 'weight', 'deadline', 'status', 'documents'];
      const patch = {};
      for (const field of allowed) {
        if (req.body[field] !== undefined) patch[field] = req.body[field];
      }

      patch.events = [
        ...(process.events || []),
        { at: new Date(), user: req.user.name, action: req.body.note || 'Processo atualizado' }
      ];

      await process.update(patch);
      res.json(process);
    } catch (error) {
      console.error('Update logistics process error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async advance(req, res) {
    try {
      const process = await LogisticsProcess.findOne({
        where: { id: req.params.id, companyId: req.user.companyId }
      });
      if (!process) return res.status(404).json({ error: 'Processo logistico nao encontrado' });

      const currentIndex = stageOrder.indexOf(process.stage);
      const nextStage = req.body.stage || stageOrder[Math.min(currentIndex + 1, stageOrder.length - 1)];
      const advanced = await this.createNextProcess(process, nextStage, req.user.name, req.body);

      res.status(201).json({ previous: process, process: advanced });
    } catch (error) {
      console.error('Advance logistics process error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async runAction(req, res) {
    try {
      const process = await LogisticsProcess.findOne({
        where: { id: req.params.id, companyId: req.user.companyId }
      });
      if (!process) return res.status(404).json({ error: 'Processo logistico nao encontrado' });

      const targetStage = this.stageForAction(req.body?.actionTitle || req.body?.title, process.stage);
      const targetProcess = targetStage && targetStage !== process.stage
        ? await this.createNextProcess(process, targetStage, req.user.name, req.body)
        : process;

      const action = this.buildActionPatch(targetProcess, req.body || {}, req.user.name);
      await targetProcess.update(action.patch);

      res.json({ previous: process, process: targetProcess, action: action.summary });
    } catch (error) {
      console.error('Run logistics action error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createFromSale(saleId, companyId, userName, transaction) {
    const sale = await Sale.findOne({
      where: { id: saleId, companyId },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'code'] }]
        }
      ],
      transaction
    });

    if (!sale) return null;

    const productSummary = (sale.items || [])
      .map((item) => item.product?.name || item.productId)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');

    const process = await LogisticsProcess.create({
      companyId,
      saleId: sale.id,
      processNumber: await this.nextProcessNumber(companyId, 'sales_order', transaction),
      stage: 'sales_order',
      salesOrderNumber: sale.saleNumber,
      clientName: sale.client?.name || 'Cliente nao informado',
      productSummary: productSummary || 'Itens da ordem',
      weight: `${Math.max(1, (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0) * 120)} kg`,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      route: 'Origem > Destino a definir',
      carrier: 'A definir',
      dock: 'A definir',
      status: 'Planejado',
      documents: { salesOrder: sale.saleNumber },
      events: [{ at: new Date(), user: userName, action: `Pedido SD ${sale.saleNumber} criou demanda logistica` }]
    }, { transaction });

    return process;
  }

  async createNextProcess(process, nextStage, userName, payload = {}) {
    const existing = await LogisticsProcess.findOne({
      where: {
        companyId: process.companyId,
        saleId: process.saleId,
        stage: nextStage
      }
    });

    if (existing) {
      const events = [
        ...(existing.events || []),
        { at: new Date(), user: userName, action: `Etapa ${nextStage} reprocessada a partir de ${process.processNumber}` }
      ];
      await existing.update({ status: payload.status || existing.status, events });
      return existing;
    }

    const number = await this.nextProcessNumber(process.companyId, nextStage);
    const documents = this.documentsForStage(process, nextStage, number);
    const next = await LogisticsProcess.create({
      companyId: process.companyId,
      saleId: process.saleId,
      processNumber: number,
      stage: nextStage,
      salesOrderNumber: process.salesOrderNumber,
      freightOrderNumber: documents.freightOrder || process.freightOrderNumber,
      waveNumber: documents.outboundDelivery || documents.wave || process.waveNumber,
      pickingTaskNumber: documents.transferOrder || documents.pickingTask || process.pickingTaskNumber,
      handlingUnit: documents.packageDocument || documents.handlingUnit || process.handlingUnit,
      shipmentNumber: documents.outboundDelivery || documents.shipment || process.shipmentNumber,
      podNumber: documents.pod || process.podNumber,
      clientName: process.clientName,
      productSummary: process.productSummary,
      weight: payload.weight || process.weight,
      deadline: payload.deadline || process.deadline,
      route: payload.route || process.route,
      carrier: payload.carrier || process.carrier,
      dock: payload.dock || process.dock,
      plate: payload.plate || process.plate,
      driver: payload.driver || process.driver,
      status: payload.status || stageStatus[nextStage] || 'Planejado',
      documents: { ...(process.documents || {}), ...documents },
      events: [
        ...(process.events || []),
        { at: new Date(), user: userName, action: `${process.stage} avancou para ${nextStage}` }
      ]
    });

    return next;
  }

  documentsForStage(process, stage, processNumber) {
    const suffix = processNumber.replace(/[^0-9]/g, '').slice(-6);
    const documents = {};
    if (stage === 'freight_order') documents.freightOrder = `OF-${suffix}`;
    if (stage === 'wave') documents.outboundDelivery = `800${suffix}`;
    if (stage === 'picking') documents.transferOrder = `TO-${suffix}`;
    if (stage === 'packing') documents.packageDocument = `PKG-${suffix}`;
    if (stage === 'expedition') documents.materialDocument = `49${suffix}`;
    if (stage === 'transport') documents.shipment = `TR-${suffix}`;
    if (stage === 'pod') documents.pod = `POD-${suffix}`;
    if (stage === 'billing') documents.billing = `FAT-${suffix}`;
    return documents;
  }

  stageForAction(actionTitle, currentStage) {
    if (['Criar entrega VL01N', 'VL10A Due list', 'Alterar entrega VL02N'].includes(actionTitle)) {
      return currentStage === 'sales_order' ? 'wave' : currentStage;
    }
    if (['Criar OT LT03', 'LT24 Monitor OT'].includes(actionTitle)) {
      return currentStage === 'wave' ? 'picking' : currentStage;
    }
    if (actionTitle === 'Confirmar OT LT12') {
      return currentStage;
    }
    if (actionTitle === 'Registrar embalagem') {
      return currentStage === 'picking' ? 'packing' : currentStage;
    }
    if (actionTitle === 'Post Goods Issue') {
      return currentStage === 'packing' ? 'expedition' : currentStage;
    }
    if (actionTitle === 'Criar transporte VT01N') {
      return currentStage === 'expedition' ? 'transport' : currentStage;
    }
    if (actionTitle === 'Confirmar POD VLPOD') {
      return ['expedition', 'transport'].includes(currentStage) ? 'pod' : currentStage;
    }
    if (actionTitle === 'Criar fatura VF01') {
      return currentStage === 'pod' ? 'billing' : currentStage;
    }

    return currentStage;
  }

  buildActionPatch(process, payload, userName) {
    const actionTitle = payload.actionTitle || payload.title || 'Acao operacional';
    const actionCode = payload.actionCode || payload.code || 'ZLOG';
    const suffix = (process.processNumber || process.id).replace(/[^0-9]/g, '').slice(-6) || '000001';
    const now = new Date();
    const documents = { ...(process.documents || {}) };
    const patch = {};
    const operational = {
      code: actionCode,
      title: actionTitle,
      executedAt: now,
      executedBy: userName
    };

    const setDocument = (key, value) => {
      documents[key] = value;
      operational[key] = value;
    };

    if (['VL10A Due list', 'Criar entrega VL01N', 'Criar onda'].includes(actionTitle)) {
      const delivery = documents.outboundDelivery || documents.delivery || `800${suffix}`;
      patch.shipmentNumber = delivery;
      patch.status = payload.status || 'Liberado';
      setDocument('deliveryDue', process.salesOrderNumber || `VA-${suffix}`);
      setDocument('outboundDelivery', delivery);
      setDocument('shippingPoint', payload.shippingPoint || 'LAM');
      setDocument('route', payload.route || process.route || 'Rota a definir');
      setDocument('deliveryCreatedAt', now);
    } else if (['Criar OT LT03', 'Confirmar OT LT12', 'LT24 Monitor OT', 'Confirmar picking', 'Confirmar WT', 'RF picking'].includes(actionTitle)) {
      const transferOrder = process.pickingTaskNumber || documents.transferOrder || `TO-${suffix}`;
      patch.pickingTaskNumber = transferOrder;
      patch.status = payload.status || 'Conferencia';
      setDocument('transferOrder', transferOrder);
      setDocument('outboundDelivery', documents.outboundDelivery || documents.delivery || process.shipmentNumber || `800${suffix}`);
      setDocument('warehouseNumber', payload.warehouseNumber || '001');
      setDocument('pickingOperator', payload.operator || 'WM');
      setDocument('pickedQuantity', payload.quantity || '1');
      setDocument('sourceBin', payload.sourceBin || 'A-01-01');
      setDocument('destinationBin', payload.destinationBin || process.dock || 'STAGE');
      setDocument('pickingConfirmedAt', now);
    } else if (['Registrar embalagem', 'Criar HU'].includes(actionTitle)) {
      const packageDocument = process.handlingUnit || documents.packageDocument || `PKG-${suffix}`;
      patch.handlingUnit = packageDocument;
      patch.status = payload.status || 'Conferencia';
      setDocument('packageDocument', packageDocument);
      setDocument('outboundDelivery', documents.outboundDelivery || documents.delivery || process.shipmentNumber || `800${suffix}`);
      setDocument('packStation', payload.packStation || 'VL02N');
      setDocument('volume', payload.volume || '1 volume');
      setDocument('grossWeight', payload.grossWeight || process.weight || 'Peso pendente');
      setDocument('packagingMaterial', payload.packagingMaterial || 'PALLET');
      setDocument('seal', payload.seal || `LAC-${suffix}`);
      setDocument('packedAt', now);
    } else if (['Post Goods Issue', 'Gate-in', 'Entrada patio'].includes(actionTitle)) {
      const materialDocument = documents.materialDocument || `49${suffix}`;
      patch.status = payload.status || 'Entregue';
      setDocument('materialDocument', materialDocument);
      setDocument('goodsIssueAt', now);
      setDocument('outboundDelivery', documents.outboundDelivery || documents.delivery || process.shipmentNumber || `800${suffix}`);
      setDocument('movementType', payload.movementType || '601');
      setDocument('goodsIssuePlate', payload.plate || process.plate || 'Placa a definir');
      setDocument('goodsIssueDriver', payload.driver || process.driver || 'Motorista a definir');
      setDocument('seal', payload.seal || documents.seal || `LAC-${suffix}`);
    } else if (['Confirmar POD VLPOD', 'Anexar POD'].includes(actionTitle)) {
      const pod = process.podNumber || documents.pod || `POD-${suffix}`;
      patch.podNumber = pod;
      patch.status = payload.status || 'Recebido';
      setDocument('pod', pod);
      setDocument('podType', payload.podType || 'POD');
      setDocument('podAttachment', payload.attachmentName || `${pod}.pdf`);
      setDocument('podReceiver', payload.receiver || process.clientName);
      setDocument('podReceivedAt', now);
      setDocument('portalStatus', payload.portalStatus || 'Publicado');
    } else if (actionTitle === 'Criar fatura VF01') {
      const billing = documents.billing || `9${suffix}`;
      patch.status = payload.status || 'Emitido';
      setDocument('billing', billing);
      setDocument('billingCreatedAt', now);
      setDocument('billingBlock', payload.billingBlock || 'Livre');
    } else {
      const artifactPrefix = payload.artifactPrefix || 'DOC';
      const artifactId = `${artifactPrefix}-${suffix}`;
      patch.status = payload.status || process.status;
      setDocument(payload.documentKey || artifactPrefix.toLowerCase(), artifactId);
    }

    patch.documents = documents;
    patch.events = [
      ...(process.events || []),
      { at: now, user: userName, action: `${actionCode} - ${actionTitle}`, details: operational }
    ];

    return { patch, summary: operational };
  }

  async nextProcessNumber(companyId, stage, transaction) {
    const prefix = {
      sales_order: 'SD',
      planning: 'PL',
      freight_order: 'OF',
      wave: 'WV',
      picking: 'WT',
      packing: 'HU',
      expedition: 'EX',
      transport: 'TR',
      pod: 'POD',
      billing: 'FI'
    }[stage] || 'LG';

    const count = await LogisticsProcess.count({ where: { companyId }, transaction });
    return `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
}

module.exports = new LogisticsProcessController();
