import axios from 'axios';

const api = axios.create({
  baseURL: '', // Vite proxy handles this
});

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

  // 승인/반려 처리
  processAction: async (id, action, approverId) => {
    const response = await api.post(`/approvals/${id}/action`, {
      action,
      approver_id: approverId
    });
    return response.data;
  }
};
