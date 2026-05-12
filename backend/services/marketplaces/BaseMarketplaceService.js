class BaseMarketplaceService {
    constructor(credentials) {
        this.credentials = credentials;
    }

    async validateCredentials() {
        throw new Error('validateCredentials method must be implemented');
    }

    async fetchOrders(status, page) {
        throw new Error('fetchOrders method must be implemented');
    }

    async fetchCustomerQuestions(startDate, endDate, status, page) {
        throw new Error('fetchCustomerQuestions method must be implemented');
    }
}

module.exports = BaseMarketplaceService; 