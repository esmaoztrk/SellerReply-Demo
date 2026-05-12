'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CustomerQuestions', 'supplierId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Mağaza ID'
    });

    await queryInterface.addColumn('CustomerQuestions', 'credentials', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CustomerQuestions', 'supplierId');
    await queryInterface.removeColumn('CustomerQuestions', 'credentials');
  }
}; 