const { Project } = require('../models');

class ProjectController {
  async index(req, res) {
    try {
      const projects = await Project.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        order: [['updatedAt', 'DESC']]
      });

      res.json({ projects });
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const {
        title,
        clientName,
        projectType,
        status = 'briefing',
        progress = 0,
        value = 0,
        deadline,
        nextStep,
        notes
      } = req.body;

      if (!title || !clientName || !projectType) {
        return res.status(400).json({ error: 'Titulo, cliente e tipo do projeto sao obrigatorios' });
      }

      const project = await Project.create({
        companyId: req.user.companyId,
        title,
        clientName,
        projectType,
        status,
        progress,
        value,
        deadline: deadline || null,
        nextStep,
        notes
      });

      res.status(201).json(project);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Projeto nao encontrado' });
      }

      await project.update(req.body);
      res.json(project);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ProjectController();
