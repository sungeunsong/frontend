import api from './axiosConfig';

export const approvalApi = {
  // 전체 결재 목록 조회
  getApprovals: async () => {
    const response = await api.get('/approvals');
    return response.data;
  },

  // 단건 결재 요청 상세 조회
  getApproval: async (id) => {
    const response = await api.get(`/approvals/${id}`);
    return response.data;
  },

  // 승인
  approve: async (id) => {
    const response = await api.post(`/approvals/${id}/approve`);
    return response.data;
  },

  // 반려
  reject: async (id, reason) => {
    const response = await api.post(`/approvals/${id}/reject`, { reason });
    return response.data;
  },

  // 댓글
  addComment: async (id, content) => {
      const response = await api.post(`/approvals/${id}/comments`, { content });
      return response.data;
  },
  
  // 로그 조회
  getLogs: async (id) => {
      const response = await api.get(`/approvals/${id}/logs`);
      return response.data;
  },

  // 결재 요청 생성
  createApproval: async (data) => {
      const response = await api.post('/approvals', data);
      return response.data;
  }
};

