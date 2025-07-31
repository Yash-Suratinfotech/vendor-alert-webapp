// src/stores/auth.js
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
    profileUpdateLoading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    fullName: (state) => {
      if (!state.user) return "";
      return state.user.username || state.user.email || "";
    },
    userInitials: (state) => {
      if (!state.user) return "";
      const name = state.user.username || state.user.email || "";
      return name.charAt(0).toUpperCase();
    },
  },
  actions: {
    initializeAuth() {
      const token = localStorage.getItem("token");
      if (token) {
        this.token = token;
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const user = localStorage.getItem("user");
        if (user) {
          try {
            this.user = JSON.parse(user);
          } catch (error) {
            console.error("Error parsing user data:", error);
            this.logout();
          }
        }
      }
    },

    async login(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await login(payload);
        if (res.user && res.token) {
          this.user = res.user;
          this.token = res.token;

          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", res.token);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.token}`;

          // Don't reload the page, let the router handle navigation
          window.location.reload();
        }
        return res;
      } catch (error) {
        this.error = error.message || "Login failed";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getProfile() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }

        const res = await getProfile(token);
        if (res?.user) {
          this.user = res.user;
          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", token);
          this.token = token;
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
        return res;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return error;
      }
    },

    async updateProfile(payload) {
      this.profileUpdateLoading = true;
      this.error = null;
      try {
        const res = await updateProfile(payload);
        if (res.status === 200) {
          // Update user data with new information
          this.user = {
            ...this.user,
            ...res.user, // Use server response to ensure data consistency
          };
          localStorage.setItem("user", JSON.stringify(this.user));
        }
        return res;
      } catch (error) {
        this.error = error.message || "Profile update failed";
        throw error;
      } finally {
        this.profileUpdateLoading = false;
      }
    },

    async getVerifyUser(tokenPayload) {
      this.loading = true;
      try {
        const res = await getVerifyUser(tokenPayload);
        if (res?.user) {
          this.user = res.user;
          this.token = res.token;

          localStorage.setItem("user", JSON.stringify(res.user));
          localStorage.setItem("token", res.token);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.token}`;
        }
        return res;
      } catch (error) {
        console.error("Error verifying user:", error);
        return error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.user = null;
      this.token = null;
      this.error = null;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("conversation");

      delete axios.defaults.headers.common["Authorization"];

      // Redirect to login page
      window.location.href = "/login";
    },

    // Helper method to update user avatar
    updateUserAvatar(avatarUrl) {
      if (this.user) {
        this.user.avatar_url = avatarUrl;
        localStorage.setItem("user", JSON.stringify(this.user));
      }
    },

    // Helper method to check if profile is complete
    isProfileComplete() {
      if (!this.user) return false;
      return !!(this.user.username && this.user.email);
    },
  },
});
