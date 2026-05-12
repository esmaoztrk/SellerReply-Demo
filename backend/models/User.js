const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,

    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'admin']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationCode: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  verificationCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'users',
  defaultScope: {
    attributes: { exclude: [] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Kullanıcı oluşturulurken şifreyi hashle
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Kullanıcı güncellenirken şifreyi hashle
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Şifre doğrulama metodu ekle
User.prototype.validatePassword = async function(password) {
  try {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Şifre doğrulama hatası:', error);
    return false;
  }
};

module.exports = User; 