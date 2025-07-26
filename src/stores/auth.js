import { defineStore } from "pinia";
import { login, getProfile, updateProfile, getVerifyUser } from "@/api/auth";
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
          window.location.reload();
        }
        return res;
      } finally {
        this.loading = false;
      }
    },

    async getProfile() {
      try {
        const token = localStorage.getItem("token");
        const res = await getProfile(token);
        if (res?.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", token);
          this.initializeAuth();
        }
        return res;
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

    async getVerifyUser(token) {
      try {
        const res = await getVerifyUser(token);
        if (res?.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", res.token);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.token}`;
          this.initializeAuth();
        }
        return res;
      } catch (error) {
        return error;
      }
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
