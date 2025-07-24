import { defineStore } from "pinia";

const side_toggle = JSON.parse(localStorage.getItem("side_toggle")) || false;

export const useLayoutStore = defineStore("layout", {
  state: () => ({
    isSidebarSmall: side_toggle,
    alert: {
      show: false,
      type: "",
      message: "",
      timeout: null,
    },
  }),
  actions: {
    toggleSidebar(data) {
      this.isSidebarSmall = data;
      localStorage.setItem("side_toggle", JSON.stringify(this.isSidebarSmall));
    },
    showAlert(message, type = "alert-success") {
      // Clear any existing timeout
      if (this.alert.timeout) {
        clearTimeout(this.alert.timeout);
      }

      // Show new alert
      this.alert.show = true;
      this.alert.message = message;
      this.alert.type = type;

      // Auto hide after 5 seconds
      this.alert.timeout = setTimeout(() => {
        this.closeAlert();
      }, 3000);
    },
    closeAlert() {
      this.alert.show = false;
      this.alert.message = "";
      this.alert.type = "";
      this.alert.timeout = null;
    },
  },
});
