import axios from './axios';

/**
 * 获取用户文件列表
 * @param {Object} params - 查询参数
 * @param {string} params.type - 文件类型 (private/public/backup)
 * @param {string} params.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const getFiles = (params) => {
  return axios.get('/files/files', { params });
};

/**
 * 上传文件
 * @param {FormData} formData - 表单数据
 * @param {File} formData.file - 要上传的文件
 * @param {string} formData.type - 文件类型 (private/public/backup)
 * @param {string} formData.parentId - 父文件夹ID
 * @param {Function} onUploadProgress - 上传进度回调
 * @returns {Promise} API响应
 */
export const uploadFile = (formData, onUploadProgress) => {
  return axios.post('/files/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
};

/**
 * 获取文件详情
 * @param {string} id - 文件ID
 * @returns {Promise} API响应
 */
export const getFile = (id) => {
  return axios.get(`/files/files/${id}`);
};

/**
 * 下载文件
 * @param {string} id - 文件ID
 * @returns {Promise} API响应
 */
export const downloadFile = (id) => {
  return axios.get(`/files/files/${id}/download`, {
    responseType: 'blob'
  });
};

/**
 * 更新文件
 * @param {string} id - 文件ID
 * @param {Object} data - 更新数据
 * @param {string} data.originalName - 原始文件名
 * @param {string} data.type - 文件类型 (private/public/backup)
 * @param {string} data.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const updateFile = (id, data) => {
  return axios.put(`/files/files/${id}`, data);
};

/**
 * 删除文件（软删除）
 * @param {string} id - 文件ID
 * @returns {Promise} API响应
 */
export const deleteFile = (id) => {
  return axios.delete(`/files/files/${id}`);
};

/**
 * 获取用户文件夹列表
 * @param {Object} params - 查询参数
 * @param {string} params.type - 文件夹类型 (private/public/backup)
 * @param {string} params.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const getFolders = (params) => {
  return axios.get('/files/folders', { params });
};

/**
 * 创建文件夹
 * @param {Object} data - 文件夹数据
 * @param {string} data.name - 文件夹名称
 * @param {string} data.type - 文件夹类型 (private/public/backup)
 * @param {string} data.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const createFolder = (data) => {
  return axios.post('/files/folders', data);
};

/**
 * 获取文件夹详情
 * @param {string} id - 文件夹ID
 * @returns {Promise} API响应
 */
export const getFolder = (id) => {
  return axios.get(`/files/folders/${id}`);
};

/**
 * 更新文件夹
 * @param {string} id - 文件夹ID
 * @param {Object} data - 更新数据
 * @param {string} data.name - 文件夹名称
 * @param {string} data.type - 文件夹类型 (private/public/backup)
 * @param {string} data.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const updateFolder = (id, data) => {
  return axios.put(`/files/folders/${id}`, data);
};

/**
 * 删除文件夹（软删除）
 * @param {string} id - 文件夹ID
 * @returns {Promise} API响应
 */
export const deleteFolder = (id) => {
  return axios.delete(`/files/folders/${id}`);
};

/**
 * 创建分享链接
 * @param {Object} data - 分享链接数据
 * @param {string} data.fileId - 文件ID
 * @param {string} data.authType - 认证类型 (none/password/code)
 * @param {string} data.password - 密码（如果authType为password）
 * @param {Date} data.expirationDate - 过期日期
 * @param {number} data.maxAccessCount - 最大访问次数
 * @returns {Promise} API响应
 */
export const createShareLink = (data) => {
  return axios.post('/files/share-links', data);
};

/**
 * 获取分享链接
 * @param {string} code - 分享码
 * @returns {Promise} API响应
 */
export const getShareLink = (code) => {
  return axios.get(`/files/share-links/${code}`);
};

/**
 * 通过分享链接下载文件
 * @param {string} code - 分享码
 * @param {Object} params - 查询参数
 * @param {string} params.password - 密码（如果需要）
 * @returns {Promise} API响应
 */
export const downloadFileByShareLink = (code, params) => {
  return axios.get(`/files/share-links/${code}/download`, {
    params,
    responseType: 'blob'
  });
};

/**
 * 获取用户的分享链接列表
 * @returns {Promise} API响应
 */
export const getShareLinks = () => {
  return axios.get('/files/share-links');
};

/**
 * 删除分享链接
 * @param {string} id - 分享链接ID
 * @returns {Promise} API响应
 */
export const deleteShareLink = (id) => {
  return axios.delete(`/files/share-links/${id}`);
};

/**
 * Semi-auth API functions - for semi-authenticated users accessing public folders
 */

/**
 * 获取semi-auth用户的文件列表（仅public类型）
 * @param {Object} params - 查询参数
 * @param {string} params.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const getSemiAuthFiles = (params) => {
  return axios.get('/files/semi-auth/files', { params });
};

/**
 * 获取semi-auth用户的文件夹列表（仅public类型）
 * @param {Object} params - 查询参数
 * @param {string} params.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const getSemiAuthFolders = (params) => {
  return axios.get('/files/semi-auth/folders', { params });
};

/**
 * Semi-auth上传文件
 * @param {FormData} formData - 表单数据
 * @param {File} formData.file - 要上传的文件
 * @param {string} formData.parentId - 父文件夹ID
 * @param {Function} onUploadProgress - 上传进度回调
 * @returns {Promise} API响应
 */
export const uploadSemiAuthFile = (formData, onUploadProgress) => {
  return axios.post('/files/semi-auth/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
};

/**
 * Semi-auth创建文件夹
 * @param {Object} data - 文件夹数据
 * @param {string} data.name - 文件夹名称
 * @param {string} data.parentId - 父文件夹ID
 * @returns {Promise} API响应
 */
export const createSemiAuthFolder = (data) => {
  return axios.post('/files/semi-auth/folders', data);
};

/**
 * Semi-auth下载文件
 * @param {string} id - 文件ID
 * @returns {Promise} API响应
 */
export const downloadSemiAuthFile = (id) => {
  return axios.get(`/files/semi-auth/files/${id}/download`, {
    responseType: 'blob'
  });
};

/**
 * Semi-auth删除文件
 * @param {string} id - 文件ID
 * @returns {Promise} API响应
 */
export const deleteSemiAuthFile = (id) => {
  return axios.delete(`/files/semi-auth/files/${id}`);
};

/**
 * Semi-auth删除文件夹
 * @param {string} id - 文件夹ID
 * @returns {Promise} API响应
 */
export const deleteSemiAuthFolder = (id) => {
  return axios.delete(`/files/semi-auth/folders/${id}`);
};
