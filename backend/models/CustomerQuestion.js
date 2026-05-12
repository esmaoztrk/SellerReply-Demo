const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomerQuestion = sequelize.define('CustomerQuestion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    marketplaceId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    questionId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('answer');
            if (!rawValue) return null;
            try {
                return JSON.parse(rawValue);
            } catch (e) {
                return rawValue;
            }
        },
        set(value) {
            if (value === null) {
                this.setDataValue('answer', null);
            } else {
                this.setDataValue('answer', 
                    typeof value === 'object' ? JSON.stringify(value) : value
                );
            }
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    barcode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    answerDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    supplierId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Mağaza ID'
    },
    credentials: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = CustomerQuestion; 