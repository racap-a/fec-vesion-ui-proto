import api from './api';

export interface FinancialSummary {
    companyCode: string;
    totalRows: number;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    lastIngestionDate: string;
}

export const FinancialService = {
    // Get Financial Summary
    getSummary: async (companyCode: string): Promise<FinancialSummary> => {
        const response = await api.get<FinancialSummary>(`/FinancialDashboard/${companyCode}/summary`);
        return response.data;
    }
};
