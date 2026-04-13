```javascript
import mongoose from 'mongoose';
import MarketingModel from '../models/marketing.model.js';

class MarketingService {
    constructor() {}

    async createMarketing(data) {
        const marketing = new MarketingModel({ ...data });
        return await marketing.save();
    }

    async getAllMarketings() {
        return await MarketingModel.find().exec();
    }

    async getMarketingById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
        const marketing = await MarketingModel.findById(id).exec();
        if (!marketing) throw new Error('Marketing not found');
        return marketing;
    }

    async updateMarketing(id, data) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
        const marketing = await MarketingModel.findByIdAndUpdate(id, { ...data }, { new: true });
        if (!marketing) throw new Error('Marketing not found');
        return marketing;
    }

    async deleteMarketing(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
        const marketing = await MarketingModel.findByIdAndRemove(id);
        if (!marketing) throw new Error('Marketing not found');
        return marketing;
    }
}

export default new MarketingService();
```