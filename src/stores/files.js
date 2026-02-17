import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  getFiles, 
  getFolders, 
  uploadFile, 
  createFolder, 
  updateFile, 
  deleteFile as deleteFileApi,
  updateFolder, 
  deleteFolder as deleteFolderApi,
  createShareLink,
  getShareLinks,
  deleteShareLink
} from '@/api/files';

export const useFilesStore = defineStore('files', () => {
  // 状态
  const files = ref([]);
  const folders = ref([]);
  const shareLinks = ref([]);
  const loading = ref(false);
  const currentFolderId = ref(null);
  const fileType = ref('private');

  // 计算属性
  const currentFiles = computed(() => {
    return files.value.filter(file => 
      file.type === fileType.value && 
      file.parentId === currentFolderId.value && 
      !file.isDeleted
    );
  });

  const currentFolders = computed(() => {
    return folders.value.filter(folder => 
      folder.type === fileType.value && 
      folder.parentId === currentFolderId.value && 
      !folder.isDeleted
    );
  });

  const allItems = computed(() => {
    const folders = currentFolders.value.map(folder => ({
      id: folder._id,
      name: folder.name,
      size: 0,
      createdAt: folder.createdAt,
      isFolder: true,
      ...folder
    }));
    
    const files = currentFiles.value.map(file => ({
      id: file._id,
      name: file.originalName,
      size: file.size,
      createdAt: file.createdAt,
      isFolder: false,
      ...file
    }));
    
    return [...folders, ...files];
  });

  // 方法
  const fetchFiles = async (params = {}) => {
    loading.value = true;
    try {
      // 更新store内部状态
      if (params.type) fileType.value = params.type;
      if (params.parentId !== undefined) currentFolderId.value = params.parentId;
      
      const response = await getFiles(params);
      if (response.data.success) {
        files.value = response.data.files;
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchFolders = async (params = {}) => {
    loading.value = true;
    try {
      // 更新store内部状态
      if (params.type) fileType.value = params.type;
      if (params.parentId !== undefined) currentFolderId.value = params.parentId;
      
      const response = await getFolders(params);
      if (response.data.success) {
        folders.value = response.data.folders;
      }
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const uploadFileAction = async (formData, onUploadProgress) => {
    try {
      const response = await uploadFile(formData, onUploadProgress);
      if (response.data.success) {
        files.value.push(response.data.file);
      }
      return response;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    }
  };

  const createFolderAction = async (data) => {
    try {
      const response = await createFolder(data);
      if (response.data.success) {
        folders.value.push(response.data.folder);
      }
      return response;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  };

  const updateFileAction = async (id, data) => {
    try {
      const response = await updateFile(id, data);
      if (response.data.success) {
        const index = files.value.findIndex(f => f._id === id);
        if (index !== -1) {
          files.value[index] = response.data.file;
        }
      }
      return response;
    } catch (error) {
      console.error('更新文件失败:', error);
      throw error;
    }
  };

  const deleteFile = async (id) => {
    try {
      const response = await deleteFileApi(id);
      if (response.data.success) {
        const index = files.value.findIndex(f => f._id === id);
        if (index !== -1) {
          files.value.splice(index, 1);
        }
      }
      return response;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  };

  const updateFolderAction = async (id, data) => {
    try {
      const response = await updateFolder(id, data);
      if (response.data.success) {
        const index = folders.value.findIndex(f => f._id === id);
        if (index !== -1) {
          folders.value[index] = response.data.folder;
        }
      }
      return response;
    } catch (error) {
      console.error('更新文件夹失败:', error);
      throw error;
    }
  };

  const deleteFolder = async (id) => {
    try {
      const response = await deleteFolderApi(id);
      if (response.data.success) {
        const index = folders.value.findIndex(f => f._id === id);
        if (index !== -1) {
          folders.value.splice(index, 1);
        }
      }
      return response;
    } catch (error) {
      console.error('删除文件夹失败:', error);
      throw error;
    }
  };

  const createShareLinkAction = async (data) => {
    try {
      const response = await createShareLink(data);
      if (response.data.success) {
        shareLinks.value.push(response.data.shareLink);
      }
      return response;
    } catch (error) {
      console.error('创建分享链接失败:', error);
      throw error;
    }
  };

  const fetchShareLinks = async () => {
    try {
      const response = await getShareLinks();
      if (response.data.success) {
        shareLinks.value = response.data.shareLinks;
      }
      return response;
    } catch (error) {
      console.error('获取分享链接失败:', error);
      throw error;
    }
  };

  const deleteShareLinkAction = async (id) => {
    try {
      const response = await deleteShareLink(id);
      if (response.data.success) {
        const index = shareLinks.value.findIndex(s => s._id === id);
        if (index !== -1) {
          shareLinks.value.splice(index, 1);
        }
      }
      return response;
    } catch (error) {
      console.error('删除分享链接失败:', error);
      throw error;
    }
  };

  const setCurrentFolder = (folderId) => {
    currentFolderId.value = folderId;
  };

  const setFileType = (type) => {
    fileType.value = type;
  };

  return {
    // 状态
    files,
    folders,
    shareLinks,
    loading,
    currentFolderId,
    fileType,

    // 计算属性
    currentFiles,
    currentFolders,
    allItems,

    // 方法
    fetchFiles,
    fetchFolders,
    uploadFileAction,
    createFolderAction,
    updateFileAction,
    deleteFile,
    updateFolderAction,
    deleteFolder,
    createShareLinkAction,
    fetchShareLinks,
    deleteShareLinkAction,
    setCurrentFolder,
    setFileType
  };
});
