const { StockBalance, StockMovement, Product } = require('../models');

const number = (value) => {
  const parsed = Number(String(value ?? 0).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

class InventoryService {
  async balance(companyId, data, transaction) {
    const materialCode = String(data.materialCode || '').trim();
    if (!materialCode) throw new Error('Codigo do material obrigatorio para movimento de estoque');
    const where = {
      companyId,
      materialCode,
      plant: data.plant || '1000',
      storageLocation: data.storageLocation || '0001'
    };
    const [balance] = await StockBalance.findOrCreate({
      where,
      defaults: { ...where, materialDescription: data.materialDescription, unit: data.unit || 'UN' },
      transaction
    });
    return balance;
  }

  async change(balance, changes, transaction) {
    const next = {
      unrestricted: number(balance.unrestricted) + number(changes.unrestricted),
      reserved: number(balance.reserved) + number(changes.reserved),
      blocked: number(balance.blocked) + number(changes.blocked)
    };
    if (Object.values(next).some((value) => value < 0)) throw new Error('Saldo insuficiente para executar o movimento');
    await balance.update(next, { transaction });
    return next;
  }

  async movement(document, data, userName, movementType, quantity, transaction) {
    await StockMovement.create({
      companyId: document.companyId,
      operationalDocumentId: document.id,
      materialCode: data.materialCode,
      movementType,
      quantity,
      plant: data.plant || '1000',
      storageLocation: data.storageLocation || '0001',
      destinationPlant: data.destinationPlant,
      destinationStorageLocation: data.destinationStorageLocation,
      userName,
      text: `${document.transactionCode} ${document.documentNumber}`
    }, { transaction });
  }

  async syncProduct(companyId, materialCode, transaction) {
    const balances = await StockBalance.findAll({ where: { companyId, materialCode, isActive: true }, transaction });
    const total = balances.reduce((sum, item) => sum + number(item.unrestricted), 0);
    await Product.update({ stockQuantity: Math.round(total) }, { where: { companyId, code: materialCode }, transaction });
  }

  async post(document, data, userName, transaction) {
    const code = document.transactionCode;
    const quantity = Math.abs(number(data.quantity));
    if (!quantity || !['MM01', 'MIGO', 'INV02', 'TR01', 'TR02', 'BL01', 'BL02', 'DV01', 'CR02', 'CG01'].includes(code)) return;

    const source = await this.balance(document.companyId, data, transaction);
    let movementType = '';
    let signedQuantity = quantity;

    if (['MM01', 'MIGO'].includes(code)) {
      movementType = code === 'MM01' ? '561' : '101';
      await this.change(source, { unrestricted: quantity }, transaction);
    } else if (code === 'INV02') {
      const delta = number(data.adjustmentQuantity || data.quantity);
      movementType = delta >= 0 ? '701' : '702';
      signedQuantity = delta;
      await this.change(source, { unrestricted: delta }, transaction);
    } else if (['TR01', 'TR02'].includes(code)) {
      movementType = '311';
      await this.change(source, { unrestricted: -quantity }, transaction);
      const destinationData = {
        ...data,
        plant: data.destinationPlant || data.plant,
        storageLocation: data.destinationStorageLocation
      };
      if (!destinationData.storageLocation) throw new Error('Deposito de destino obrigatorio');
      const destination = await this.balance(document.companyId, destinationData, transaction);
      await this.change(destination, { unrestricted: quantity }, transaction);
    } else if (code === 'BL01') {
      movementType = '344';
      await this.change(source, { unrestricted: -quantity, blocked: quantity }, transaction);
    } else if (code === 'BL02') {
      movementType = '343';
      await this.change(source, { unrestricted: quantity, blocked: -quantity }, transaction);
    } else if (code === 'CR02') {
      movementType = '319';
      await this.change(source, { unrestricted: -quantity, reserved: quantity }, transaction);
    } else if (code === 'CG01') {
      movementType = '601';
      const reserved = number(source.reserved);
      await this.change(source, reserved >= quantity ? { reserved: -quantity } : { unrestricted: -quantity }, transaction);
      signedQuantity = -quantity;
    } else if (code === 'DV01') {
      movementType = '122';
      await this.change(source, { unrestricted: -quantity }, transaction);
      signedQuantity = -quantity;
    }

    await this.movement(document, data, userName, movementType, signedQuantity, transaction);
    await this.syncProduct(document.companyId, data.materialCode, transaction);
  }
}

module.exports = new InventoryService();
