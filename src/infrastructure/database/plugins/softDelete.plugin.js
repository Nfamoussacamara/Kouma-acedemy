export function softDeletePlugin(schema) {
  schema.add({ isActive: { type: Boolean, default: true } });
  
  const filterInactive = function(next) {
    this.where({ isActive: { $ne: false } });
    next();
  };

  // Appliquer le filtre sur toutes les méthodes de recherche
  schema.pre('find', filterInactive);
  schema.pre('findOne', filterInactive);
  schema.pre('findOneAndUpdate', filterInactive);
  schema.pre('countDocuments', filterInactive);
}
