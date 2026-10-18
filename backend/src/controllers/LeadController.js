const { Lead, Company, Project } = require('../models');

const projectBaseValues = {
  site: 400,
  landing: 400,
  essential_system: 400,
  complete_system: 400,
  system: 400,
  ecommerce: 400,
  app: 400,
  automation: 400
};

const featureValues = {
  mobile: 400,
  integrations: 400,
  multi_company: 400,
  subscription: 400,
  fiscal: 400,
  advanced_reports: 400,
  brand: 400
};

function estimateValue(projectType, features = []) {
  const base = projectBaseValues[projectType] || 400;
  const extras = features.reduce((total, feature) => total + (featureValues[feature] || 0), 0);
  return base + extras;
}

class LeadController {
  async publicStore(req, res) {
    try {
      const {
        name,
        companyName,
        email,
        phone,
        projectType,
        budgetRange,
        urgency,
        features = [],
        message
      } = req.body;

      if (!name || !phone || !projectType) {
        return res.status(400).json({ error: 'Nome, telefone e tipo de projeto sao obrigatorios' });
      }

      const company = await Company.findOne({ where: { isActive: true } });
      if (!company) {
        return res.status(500).json({ error: 'Empresa principal nao encontrada' });
      }

      const estimatedValue = estimateValue(projectType, Array.isArray(features) ? features : []);

      const lead = await Lead.create({
        companyId: company.id,
        name,
        companyName,
        email,
        phone,
        projectType,
        budgetRange,
        urgency,
        features: Array.isArray(features) ? features : [],
        estimatedValue,
        message,
        source: 'site',
        status: 'new'
      });

      res.status(201).json({
        message: 'Orcamento recebido com sucesso',
        lead: {
          id: lead.id,
          estimatedValue: lead.estimatedValue,
          status: lead.status
        }
      });
    } catch (error) {
      console.error('Erro ao criar lead publico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async index(req, res) {
    try {
      const leads = await Lead.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        order: [['createdAt', 'DESC']]
      });

      res.json({ leads });
    } catch (error) {
      console.error('Erro ao listar leads:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const allowedStatuses = ['new', 'contacted', 'proposal', 'won', 'lost'];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status invalido' });
      }

      const lead = await Lead.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead nao encontrado' });
      }

      const updates = {};
      if (status) updates.status = status;

      if (note) {
        const label = status || lead.status;
        const stampedNote = `[${new Date().toLocaleString('pt-BR')}] ${label}: ${note}`;
        updates.message = [lead.message, stampedNote].filter(Boolean).join('\n\n');
      }

      await lead.update(updates);
      res.json(lead);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const lead = await Lead.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!lead) {
        return res.status(404).json({ error: 'Orcamento nao encontrado' });
      }

      await lead.update({ isActive: false });
      res.json({ message: 'Orcamento removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createProject(req, res) {
    try {
      const { id } = req.params;

      const lead = await Lead.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        },
        include: [{ model: Project, as: 'project', required: false }]
      });

      if (!lead) {
        return res.status(404).json({ error: 'Orcamento nao encontrado' });
      }

      if (lead.project) {
        return res.status(409).json({ error: 'Esse orcamento ja virou projeto', project: lead.project });
      }

      const clientName = lead.companyName || lead.name;
      const project = await Project.create({
        companyId: req.user.companyId,
        leadId: lead.id,
        title: `${clientName} - ${lead.projectType}`,
        clientName,
        projectType: lead.projectType,
        status: 'briefing',
        progress: 10,
        value: lead.estimatedValue || 0,
        nextStep: 'Agendar briefing, confirmar escopo e separar acessos do cliente.',
        notes: lead.message || null
      });

      await lead.update({ status: 'won' });

      res.status(201).json({ project, lead });
    } catch (error) {
      console.error('Erro ao transformar orcamento em projeto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new LeadController();
