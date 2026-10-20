class MongooseFiscalQueryRepository {
  constructor(Model) {
    this.Model = Model;
  }

  findByIdempotencyKey(tenant, idempotencyKey) {
    return this.Model.findOne({ tenant, idempotencyKey }).lean().exec();
  }

  async createProcessing(data) {
    const result = await this.Model.create(data);
    const query = result.toObject();
    return { ...query, id: String(query._id) };
  }

  complete(id, tenant, result) {
    return this.Model.findOneAndUpdate(
      { _id: id, tenant, status: 'PROCESSING' },
      { $set: result },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();
  }

  fail(id, tenant, result) {
    return this.Model.findOneAndUpdate(
      { _id: id, tenant, status: 'PROCESSING' },
      { $set: result },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();
  }
}

module.exports = { MongooseFiscalQueryRepository };
