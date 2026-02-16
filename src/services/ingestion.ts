import api from './api';

export interface IngestionLog {
    logID: number;
    companyID: number;
    userID: number;
    fileName: string;
    originalFileName: string;
    status: 'Uploaded' | 'Processing' | 'Completed' | 'Failed';
    currentStep: string;
    engineOutput: string;
    processedRows: number | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UploadResponse {
    message: string;
    logId: number;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    companyCode: string;
    landingZone: string;
    hasBomWarning: boolean;
    timestamp: string;
}

export interface TriggerResponse {
    success: boolean;
    message: string;
    error?: string;
}

export const IngestionService = {
    // Upload File
    uploadFile: async (companyId: number, file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<UploadResponse>(`/fecingestion/upload/${companyId}`, formData);
        return response.data;
    },

    // Trigger Engine
    triggerEngine: async (logId: number): Promise<TriggerResponse> => {
        const response = await api.post<TriggerResponse>(`/fecingestion/trigger-engine/${logId}`);
        return response.data;
    },

    // Poll Status
    getStatus: async (logId: number): Promise<IngestionLog> => {
        const response = await api.get<IngestionLog>(`/fecingestion/status/${logId}`);
        return response.data;
    },

    // Get History
    getHistory: async (companyId: number): Promise<IngestionLog[]> => {
        const response = await api.get<IngestionLog[]>(`/fecingestion/logs/${companyId}`);
        return response.data;
    },

    // Get Log Detail
    getLogDetail: async (logId: number): Promise<IngestionLog> => {
        const response = await api.get<IngestionLog>(`/fecingestion/logs/detail/${logId}`);
        return response.data;
    }
};
