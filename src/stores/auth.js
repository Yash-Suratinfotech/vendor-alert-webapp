import { defineStore } from "pinia";
import { login, updateProfile } from "@/api/auth";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    token: localStorage.getItem("token") || null,
    payments: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    initializeAuth() {
      const token = localStorage.getItem("token");
      if (token) {
        this.token = token;
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const user = localStorage.getItem("user");
        if (user) {
          this.user = JSON.parse(user);
        }
      }
    },

    async login(payload) {
      this.loading = true;
      try {
        const res = await login(payload);
        if (res.user && res.token) {
          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", res.token);
          this.initializeAuth();
        }

        return res;
      } finally {
        this.loading = false;
      }
    },

    async getProfile(token) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/auth/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data?.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          localStorage.setItem("token", token);
          this.initializeAuth();
        }
        return response.data;
      } catch (error) {
        return error;
      }
    },

    async updateProfile(payload) {
      this.loading = true;
      try {
        const res = await updateProfile(payload);
        if (res.status == 200) {
          this.user = {
            ...this.user,
            ...payload,
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res;
      } finally {
        this.loading = false;
      }
    },

    async userUpdateData(data) {
      this.user = {
        ...this.user,
        ...data,
      };
    },

    async logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.reload();
    },
  },
});
