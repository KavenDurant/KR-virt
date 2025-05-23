import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // API的基础URL
  timeout: 10000,  // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里做一些请求前的处理，例如添加token等
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 可以根据业务需求自定义成功的判断逻辑
    if (response.status === 200) {
      return res;
    }
    return Promise.reject(new Error('请求失败'));
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default request;
