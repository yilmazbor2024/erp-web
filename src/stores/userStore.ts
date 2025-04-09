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
      const users = await userApi.list();
      set({ users, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await userApi.getCurrentUser();
      set({ currentUser: user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createUser: async (data: CreateUserRequest) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.create(data);
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
      await userApi.update(id, data);
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
      await userApi.delete(id);
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
      const updatedUser = await userApi.updateProfile(data);
      set({ currentUser: updatedUser, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      set({ isLoading: true, error: null });
      await userApi.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));

export default useUserStore; 