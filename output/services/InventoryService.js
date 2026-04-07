```javascript
import mongoose from 'mongoose';

const Inventory = mongoose.model('Inventory');

class InventoryService {
    constructor() {}

    async getAllInventories(query) {
        const inventories = await Inventory.find(query);
        return inventories;
    }

    async getInventoryById(id) {
        const inventory = await Inventory.findById(id);
        if (!inventory) throw new Error('Inventory not found');
        return inventory;
    }

    async createInventory(data) {
        const inventory = new Inventory(data);
        await inventory.save();
        return inventory;
    }

    async updateInventoryById(id, data) {
        const inventory = await this.getInventoryById(id);
        Object.assign(inventory, data);
        await inventory.save();
        return inventory;
    }

    async deleteInventoryById(id) {
        const inventory = await this.getInventoryById(id);
        await Inventory.deleteOne({ _id: id });
        return inventory;
    }
}

export default new InventoryService();
```