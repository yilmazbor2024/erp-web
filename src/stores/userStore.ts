import { create } from 'zustand';
import { userApi, User, CreateUserRequest, UpdateUserRequest } from '../services/api';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ isLoading: true, error: null });
      const users = await userApi.getUsers();
      set({ users, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true, error: null });
      // API'de getCurrentUser metodu yok, getUser kullanıyoruz
      // Kullanıcı ID'si bilinmiyorsa, önce getUsers çağırıp ilk kullanıcıyı alabiliriz
      const users = await userApi.getUsers();
      const user = users && users.length > 0 ? users[0] : null;
      set({ currentUser: user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createUser: async (data: CreateUserRequest) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.createUser(data);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (id: string, data: UpdateUserRequest) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.updateUser(id, data);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.deleteUser(id);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });
      // updateProfile metodu mevcut değil, updateUser kullanıyoruz
      // Kullanıcı ID'si gerektiğinden, mevcut kullanıcı ID'sini alıyoruz
      const currentUser = get().currentUser;
      if (!currentUser || !currentUser.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }
      // Partial<User> tipini UpdateUserRequest tipine dönüştürüyoruz
      const updateRequest: any = {
        ...data,
        // Zorunlu alanları ekleyelim
        userName: data.userName || currentUser.userName,
        email: data.email || currentUser.email,
        // Diğer gerekli alanlar
      };
      
      const updatedUser = await userApi.updateUser(currentUser.id, updateRequest);
      set({ currentUser: updatedUser, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });
      // changePassword metodu API'de bulunmuyor
      // Bu işlevi geçici olarak devre dışı bırakıyoruz
      console.warn('changePassword metodu API\'de bulunmuyor');
      // TODO: API'de şifre değiştirme işlevi eklendiğinde bu kısmı güncelle
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default useUserStore; 