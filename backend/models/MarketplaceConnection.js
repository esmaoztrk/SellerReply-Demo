const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketplaceConnection = sequelize.define('marketplaceConnection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  marketplaceId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  credentials: {
    type: DataTypes.JSON,
    allowNull: false
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = MarketplaceConnection; 