const { Contract, Receivable } = require('../models');

class ContractController {
  async index(req, res) {
    try {
      const contracts = await Contract.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        order: [['nextBillingDate', 'ASC'], ['updatedAt', 'DESC']]
      });

      res.json({ contracts });
    } catch (error) {
      console.error('Erro ao listar contratos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const {
        projectId,
        clientName,
        title,
        recurrence = 'monthly',
        amount,
        nextBillingDate,
        status = 'active',
        notes
      } = req.body;

      if (!clientName || !title || !amount) {
        return res.status(400).json({ error: 'Cliente, titulo e valor sao obrigatorios' });
      }

      const contract = await Contract.create({
        companyId: req.user.companyId,
        projectId: projectId || null,
        clientName,
        title,
        recurrence,
        amount,
        nextBillingDate: nextBillingDate || null,
        status,
        notes
      });

      res.status(201).json(contract);
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const contract = await Contract.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato nao encontrado' });
      }

      await contract.update(req.body);
      res.json(contract);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createReceivable(req, res) {
    try {
      const { id } = req.params;
      const contract = await Contract.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato nao encontrado' });
      }

      const dueDate = contract.nextBillingDate || new Date();
      const receivable = await Receivable.create({
        companyId: req.user.companyId,
        description: `${contract.title} - ${contract.clientName}`,
        amount: contract.amount,
        dueDate,
        notes: `Cobranca gerada pelo contrato ${contract.title}. Cliente: ${contract.clientName}`,
        status: 'pending'
      });

      const nextDate = new Date(dueDate);
      if (contract.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (contract.recurrence === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
      if (contract.recurrence === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      if (contract.recurrence !== 'one_time') {
        await contract.update({ nextBillingDate: nextDate });
      }

      res.status(201).json({ receivable, contract });
    } catch (error) {
      console.error('Erro ao gerar cobranca do contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async document(req, res) {
    try {
      const { id } = req.params;
      const contract = await Contract.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato nao encontrado' });
      }

      const recurrenceLabels = {
        monthly: 'mensal',
        quarterly: 'trimestral',
        yearly: 'anual',
        one_time: 'pagamento unico'
      };

      res.json({
        title: `Contrato de prestacao de servicos - ${contract.clientName}`,
        content: [
          'CONTRATO DE PRESTACAO DE SERVICOS DIGITAIS',
          '',
          `CONTRATADA: JV Sistemas & Tecnologia.`,
          `CONTRATANTE: ${contract.clientName}.`,
          '',
          `OBJETO: ${contract.title}.`,
          `VALOR: R$ ${Number(contract.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
          `RECORRENCIA: ${recurrenceLabels[contract.recurrence] || contract.recurrence}.`,
          `PROXIMA COBRANCA: ${contract.nextBillingDate || 'a definir'}.`,
          '',
          'ESCOPO: desenvolvimento, manutencao, suporte ou acompanhamento conforme combinado entre as partes.',
          'PRAZOS E ENTREGAS: definidos por briefing, materiais enviados pelo cliente e validacoes durante o projeto.',
          'PAGAMENTO: o servico permanece ativo mediante pagamento nas datas combinadas.',
          'SUPORTE: ajustes e atendimento seguem as condicoes acordadas neste contrato ou proposta comercial.',
          '',
          'Assinatura CONTRATANTE: ____________________________________',
          'Assinatura JV SISTEMAS: _____________________________________'
        ].join('\n')
      });
    } catch (error) {
      console.error('Erro ao gerar documento do contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ContractController();
