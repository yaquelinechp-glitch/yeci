import axios from 'axios';
import { useAuthStore } from '../store/auth';
import i18n from '../i18n';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/google') || url.includes('/partner-users/register');
      if (!isAuthEndpoint) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

const lang = () => i18n.language || 'en';

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  googleLogin: (credential: string) => api.post('/auth/google', { credential }),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data: { first_name?: string; last_name?: string; username?: string; avatar?: string; country?: string }) => api.put('/profile', data),
};

export const partnersApi = {
  list: () => api.get('/partners/'),
  solicitudes: () => api.get('/partners/solicitudes/list'),
  get: (id: string) => api.get(`/partners/${id}`),
  update: (id: string, data: any) => api.patch(`/partners/${id}`, data),
};

export const coursesApi = {
  list: () => api.get(`/courses/?lang=${lang()}`),
  get: (id: string) => api.get(`/courses/${id}?lang=${lang()}`),
  create: (data: { title: Record<string, string>; description: Record<string, string>; category: string; level: string; phase_config?: { phase: number; days: number }[] }) => api.post('/courses/', data),
  update: (id: string, data: any) => api.patch(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  uploadVideo: (courseId: string, file: File, title: string, description: string, videoOrder: number, phase: number, day: number) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/courses/${courseId}/videos?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&video_order=${videoOrder}&phase=${phase}&day=${day}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addVideoUrl: (courseId: string, url: string, title: string, description: string, videoOrder: number, phase: number, day: number) =>
    api.post(`/courses/${courseId}/videos?video_url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&video_order=${videoOrder}&phase=${phase}&day=${day}`),
  deleteVideo: (courseId: string, videoId: string) => api.delete(`/courses/${courseId}/videos/${videoId}`),
  uploadMaterial: (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/materials/upload?name=${encodeURIComponent(name)}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadThumbnail: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/thumbnails/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getProgress: (courseId: string) => api.get(`/courses/progress/${courseId}?lang=${lang()}`),
  getVideoProgress: (courseId: string) => api.get(`/courses/${courseId}/video-progress`),
  markProgress: (courseId: string, videoId: string, completed: boolean) => api.post('/courses/progress', { course_id: courseId, video_id: videoId, completed }),
  getPartnerProgress: (partnerId: string) => api.get(`/courses/progress/${partnerId}?lang=${lang()}`),
  updateProgress: (courseId: string, progressPct: number, completed: boolean) => api.post('/courses/progress', { course_id: courseId, progress_pct: progressPct, completed }),
  // Quiz
  getQuizQuestions: (courseId: string, videoId: string) => api.get(`/courses/${courseId}/videos/${videoId}/quiz?lang=${lang()}`),
  createQuizQuestion: (courseId: string, videoId: string, data: any) => api.post(`/courses/${courseId}/videos/${videoId}/quiz`, data),
  updateQuizQuestion: (courseId: string, videoId: string, questionId: string, data: any) => api.put(`/courses/${courseId}/videos/${videoId}/quiz/${questionId}`, data),
  deleteQuizQuestion: (courseId: string, videoId: string, questionId: string) => api.delete(`/courses/${courseId}/videos/${videoId}/quiz/${questionId}`),
  submitQuiz: (courseId: string, videoId: string, answers: { question_id: string; selected_index: number }[]) => api.post(`/courses/${courseId}/videos/${videoId}/quiz/submit`, { answers }),
  getQuizResults: (courseId: string, videoId: string) => api.get(`/courses/${courseId}/videos/${videoId}/quiz/results`),
  duplicate: (courseId: string) => api.post(`/courses/${courseId}/duplicate`),
  reorderVideos: (courseId: string, order: string[]) => api.post(`/courses/${courseId}/videos/reorder`, { order }),
  quizBank: () => api.get(`/courses/quiz-bank?lang=${lang()}`),
  createBankQuestion: (data: any) => api.post('/courses/quiz-bank', data),
  updateBankQuestion: (id: string, data: any) => api.put(`/courses/quiz-bank/${id}`, data),
  deleteBankQuestion: (id: string) => api.delete(`/courses/quiz-bank/${id}`),
  addBankToVideo: (courseId: string, videoId: string, bankId: string) => api.post(`/courses/${courseId}/videos/${videoId}/quiz/bank/${bankId}`),
  generateVideoQuiz: (courseId: string, videoId: string, count: number) => api.post(`/courses/${courseId}/videos/${videoId}/quiz/generate`, { count }),
  getExam: (courseId: string) => api.get(`/courses/${courseId}/exam?lang=${lang()}`),
  submitExam: (courseId: string, answers: any[]) => api.post(`/courses/${courseId}/exam/submit`, { answers }),

  getExamQuestions: (courseId: string) => api.get(`/courses/${courseId}/exam-questions`),
  createExamQuestion: (courseId: string, data: any) => api.post(`/courses/${courseId}/exam-questions/create`, data),
  updateExamQuestion: (courseId: string, questionId: string, data: any) => api.put(`/courses/${courseId}/exam-questions/${questionId}`, data),
  deleteExamQuestion: (courseId: string, questionId: string) => api.delete(`/courses/${courseId}/exam-questions/${questionId}/delete`),
  reorderExamQuestions: (courseId: string, order: string[]) => api.post(`/courses/${courseId}/exam-questions/reorder`, { order }),
  generateExamFromBank: (courseId: string, count: number) => api.post(`/courses/${courseId}/exam-questions/generate`, { count }),
  getRating: (courseId: string) => api.get(`/courses/${courseId}/rating`),
  submitRating: (courseId: string, stars: number, comment: string) => api.post(`/courses/${courseId}/rating`, { stars, comment }),
  getAssignments: (courseId: string) => api.get(`/courses/${courseId}/assignments`),
  createAssignment: (courseId: string, partnerId: string, deadline: string) => api.post(`/courses/${courseId}/assignments`, { partner_id: partnerId, deadline }),
  deleteAssignment: (courseId: string, assignmentId: string) => api.delete(`/courses/${courseId}/assignments/${assignmentId}`),
  trackWatchTime: (videoId: string, watchSeconds: number) => api.post('/courses/watch-time', { video_id: videoId, watch_seconds: watchSeconds }),
};

export const dealsApi = {
  list: () => api.get('/deals/'),
  listAll: () => api.get('/deals/all'),
  create: (data: any) => api.post('/deals/', data),
  update: (id: string, data: any) => api.patch(`/deals/${id}`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
  myCommissions: () => api.get('/commissions/'),
};

export const reportsApi = {
  adminStats: () => api.get('/reports/admin/stats'),
  partnerStats: () => api.get('/reports/partner/stats'),
};

export const pipelineApi = {
  list: (params?: { stage?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.stage) q.set('stage', params.stage);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get(`/pipeline/${qs ? '?' + qs : ''}`);
  },
  create: (data: any) => api.post('/pipeline/', data),
  get: (id: string) => api.get(`/pipeline/${id}`),
  update: (id: string, data: any) => api.patch(`/pipeline/${id}`, data),
  delete: (id: string) => api.delete(`/pipeline/${id}`),
  stats: () => api.get('/pipeline/stats'),
  events: (id: string) => api.get(`/pipeline/${id}/events`),
  automation: () => api.post('/pipeline/automation'),
};

export const productsApi = {
  list: () => api.get('/products/'),
  create: (data: any) => api.post('/products/', data),
  update: (key: string, data: any) => api.patch(`/products/${key}`, data),
  remove: (key: string) => api.delete(`/products/${key}`),
};

export const calculatorApi = {
  settings: () => api.get('/calculator/settings'),
  saveSettings: (data: any) => api.put('/calculator/settings', data),
  exportExcel: (data: any) =>
    api.post('/calculator/export', data, { params: { lang: lang() }, responseType: 'blob' }),
};

export const chatApi = {
  send: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    api.post('/chat', { messages, lang: lang() }, { timeout: 70000 }),
};

export const notificationsApi = {
  list: () => api.get(`/notifications/?lang=${lang()}`),
  unreadCount: () => api.get('/notifications/unread'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  broadcast: (title: string, message: string, link: string) => api.post('/notifications/broadcast', { title, message, link }),
};

export const lmsApi = {
  overview: () => api.get(`/lms/overview?lang=${lang()}`),
  report: () => api.get('/lms/report'),
  certificate: (courseId: string) => api.get(`/lms/certificate/${courseId}?lang=${lang()}`),
  onboarding: () => api.get(`/lms/onboarding?lang=${lang()}`),
  startOnboarding: () => api.post(`/lms/onboarding?lang=${lang()}`),
  setOnboardingStep: (key: string, done: boolean) => api.patch(`/lms/onboarding/step?lang=${lang()}`, { key, done }),
  exportExcel: () => api.get('/lms/export', { responseType: 'blob' }),
  analytics: () => api.get('/lms/analytics'),
  checkDeadlines: () => api.get('/lms/check-deadlines'),
};

export const adminApi = {
  loginAttempts: () => api.get('/admin/login-attempts'),
  blacklistedTokens: () => api.get('/admin/blacklisted-tokens'),
  registerAdmin: (data: { company_name: string; email: string; password: string; contact_name?: string; phone?: string; tax_id?: string }) => api.post('/admin/register-admin', data),
};

export const partnerUsersApi = {
  list: (partnerId?: string) => api.get('/partner-users/', { params: partnerId ? { partner_id: partnerId } : {} }),
  invite: (email: string, contactName: string, role: string) => api.post('/partner-users/', { email, contact_name: contactName, role }),
  update: (id: string, data: any) => api.patch(`/partner-users/${id}`, data),
  remove: (id: string) => api.delete(`/partner-users/${id}`),
  inviteInfo: (token: string) => api.get(`/partner-users/invite/${token}`),
  registerWithInvite: (inviteToken: string, contactName: string, password: string) => api.post('/partner-users/register', { invite_token: inviteToken, contact_name: contactName, password }),
};

export const conflictsApi = {
  list: (params?: any) => api.get('/conflicts/', { params }),
  create: (data: any) => api.post('/conflicts/', data),
  get: (id: string) => api.get(`/conflicts/${id}`),
  update: (id: string, data: any) => api.patch(`/conflicts/${id}`, data),
  remove: (id: string) => api.delete(`/conflicts/${id}`),
  stats: () => api.get('/conflicts/stats'),
};

export default api;
