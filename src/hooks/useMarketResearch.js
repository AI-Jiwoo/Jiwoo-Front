// hooks/useMarketResearch.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../apis/api';

const getAuthHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('access-token')}` }
});

export const useBusinesses = () => {
    return useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {
            const response = await api.get('/business/user', getAuthHeader());
            return response.data.business || [];
        }
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/category/names', getAuthHeader());
            return response.data || [];
        }
    });
};

export const useResearchHistory = (page) => {
    return useQuery({
        queryKey: ['researchHistory', page],
        queryFn: async () => {
            const response = await api.get(`/market-research/history?page=${page}&size=10`, getAuthHeader());
            return {
                data: response.data.data || [],
                totalPages: response.data.totalPages || 1
            };
        }
    });
};

export const useMarketAnalysis = () => {
    const queryClient = useQueryClient();

    const analyzeMarket = async ({ type, data }) => {
        const timestamp = new Date().getTime();
        const headers = {
            ...getAuthHeader().headers,
            'Content-Type': 'application/json'
        };

        const results = {
            marketInformation: null,
            competitorAnalysis: null,
            marketTrends: null
        };

        if (type === 'all' || type === 'marketSize') {
            const marketSizeResponse = await api.post(
                `/market-research/market-size-growth?t=${timestamp}`,
                data,
                { headers }
            );
            results.marketInformation = marketSizeResponse.data.data;
        }

        if (type === 'all' || type === 'similarServices') {
            const similarServicesResponse = await api.post(
                `/market-research/similar-services-analysis?t=${timestamp}`,
                data,
                { headers }
            );
            results.competitorAnalysis = similarServicesResponse.data.data;
        }

        if (type === 'all' || type === 'trendCustomerTechnology') {
            const trendResponse = await api.post(
                `/market-research/trend-customer-technology?t=${timestamp}`,
                data,
                { headers }
            );
            results.marketTrends = trendResponse.data.data;
        }

        return results;
    };

    const saveHistory = async (historyData) => {
        return api.post('/market-research/save-history', historyData, {
            headers: {
                ...getAuthHeader().headers,
                'Content-Type': 'application/json'
            }
        });
    };

    return useMutation({
        mutationFn: analyzeMarket,
        onSuccess: async (data) => {
            // Save history after successful analysis
            const historyData = {
                createAt: new Date().toISOString(),
                marketInformation: JSON.stringify(data.marketInformation),
                competitorAnalysis: JSON.stringify(data.competitorAnalysis),
                marketTrends: JSON.stringify(data.marketTrends)
            };

            try {
                await saveHistory(historyData);
                // Invalidate research history query to trigger refresh
                queryClient.invalidateQueries(['researchHistory']);
            } catch (error) {
                console.error('Failed to save history:', error);
            }
        }
    });
};