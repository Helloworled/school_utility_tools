<template>
  <v-app>
    <!-- Navigation Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>School Utility Tools</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Navigation Links for Authenticated Users -->
      <template v-if="authStore.isAuthenticated">
        <v-btn to="/dashboard" text>Dashboard</v-btn>
        <v-btn to="/calendar" text>Calendar</v-btn>
        <v-btn to="/todos" text>Todos</v-btn>
        <v-btn to="/profile" text>Profile</v-btn>
        <v-btn text @click="handleLogout">Logout</v-btn>
      </template>
      
      <!-- Navigation Links for Guest Users -->
      <template v-else>
        <v-btn to="/login" text>Login</v-btn>
        <v-btn to="/register" text>Register</v-btn>
      </template>
    </v-app-bar>
    
    <!-- Main Content -->
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Initialize auth state on app mount
onMounted(async () => {
  await authStore.initializeAuth();
});

// Handle logout
const handleLogout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
