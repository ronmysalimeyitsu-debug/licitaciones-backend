const licitationsStore = require('./licitations.store');
const LicitationMapper = require('./licitation.mapper');
const BadRequestError = require('../../errors/bad-request-error');
const NotFoundError = require('../../errors/not-found-error');

class LicitationsService {
  async getActiveLicitations() {
    const rows = await licitationsStore.findAllActive();
    return LicitationMapper.toDTOList(rows);
  }

  async getAllLicitations() {
    const rows = await licitationsStore.findAll();
    return LicitationMapper.toDTOList(rows);
  }

  async getLicitationById(id) {
    const row = await licitationsStore.findById(id);
    if (!row) {
      throw new NotFoundError(`Licitación con ID ${id} no encontrada.`);
    }
    return LicitationMapper.toDTO(row);
  }

  async createLicitation(payload) {
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new BadRequestError('El título de la licitación es obligatorio.');
    }

    if (!payload.description || typeof payload.description !== 'string') {
      throw new BadRequestError('La descripción de la licitación es obligatoria.');
    }

    if (!payload.closingDate) {
      throw new BadRequestError('La fecha de cierre (closingDate) es obligatoria.');
    }

    const closingDate = new Date(payload.closingDate);
    if (isNaN(closingDate.getTime()) || closingDate <= new Date()) {
      throw new BadRequestError('La fecha de cierre debe ser una fecha futura válida.');
    }

    const created = await licitationsStore.create({
      title: payload.title.trim(),
      description: payload.description.trim(),
      budget: payload.budget ? Number(payload.budget) : null,
      status: 'active',
      closingDate,
    });

    return LicitationMapper.toDTO(created);
  }
}

module.exports = new LicitationsService();

