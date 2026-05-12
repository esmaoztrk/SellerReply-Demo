const User = require('./User');
const MarketplaceConnection = require('./MarketplaceConnection');
const Order = require('./Order');

// İlişkileri kur
Order.belongsTo(MarketplaceConnection, {
    foreignKey: 'storeId',
    as: 'store',
    onDelete: 'CASCADE'
});

MarketplaceConnection.hasMany(Order, {
    foreignKey: 'storeId',
    as: 'orders',
    onDelete: 'CASCADE'
});

// İlişkileri tanımla
User.hasMany(MarketplaceConnection, { foreignKey: 'userId' });
MarketplaceConnection.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  MarketplaceConnection,
  Order
}; 