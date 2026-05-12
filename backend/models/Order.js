const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
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
    storeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orderId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    orderData: {
        type: DataTypes.JSON,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    orderDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'TRY'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['marketplaceId', 'orderId', 'storeId']
        }
    ]
});

// MarketplaceConnection ile ilişki kur
Order.associate = (models) => {
    Order.belongsTo(models.MarketplaceConnection, {
        foreignKey: 'storeId',
        as: 'store',
        onDelete: 'CASCADE' // Mağaza silindiğinde siparişler de silinsin
    });
};

module.exports = Order; 