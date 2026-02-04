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
        <v-btn to="/notifications" text>Notifications</v-btn>
        <NotificationBadge />
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
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { initializeWebSocket, disconnectWebSocket } from '@/plugins/websocket';
import NotificationBadge from '@/components/NotificationBadge.vue';

const router = useRouter();
const authStore = useAuthStore();

// Initialize auth state on app mount
onMounted(async () => {
  await authStore.initializeAuth();

  // Initialize WebSocket if user is authenticated
  if (authStore.isAuthenticated) {
    initializeWebSocket();
  }
});

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    initializeWebSocket();
  } else {
    disconnectWebSocket();
  }
});

// Handle logout
const handleLogout = async () => {
  await authStore.logout();
  disconnectWebSocket();
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

/* Set button hover opacity to 75% */
.v-btn:hover {
  opacity: 0.75 !important;
}

/* Override Vuetify default button hover background color for all button variants */
.v-btn--variant-elevated:hover,
.v-btn--variant-flat:hover,
.v-btn--variant-tonal:hover,
.v-btn--variant-outlined:hover,
.v-btn--variant-text:hover,
.v-btn--variant-contained:hover {
  opacity: 0.75 !important;
}

/* Override specific color buttons on hover */
.v-btn--variant-elevated.v-btn--color-primary:hover,
.v-btn--variant-flat.v-btn--color-primary:hover,
.v-btn--variant-tonal.v-btn--color-primary:hover {
  background-color: #1976D2 !important;
  opacity: 0.75 !important;
}

.v-btn--variant-elevated.v-btn--color-grey:hover,
.v-btn--variant-flat.v-btn--color-grey:hover,
.v-btn--variant-tonal.v-btn--color-grey:hover {
  background-color: #9E9E9E !important;
  opacity: 0.75 !important;
}

/* Override default hover behavior for all buttons */
.v-btn:hover > .v-btn__overlay {
  opacity: 0.25 !important;
}

/* Override card hover overlay opacity */
.v-card:hover > .v-card__overlay {
  opacity: 0.1 !important;
}

/* Override list item hover overlay opacity */
.v-list-item:hover > .v-list-item__overlay {
  opacity: 0.1 !important;
}

/* Override chip hover overlay opacity */
.v-chip:hover > .v-chip__overlay {
  opacity: 0.1 !important;
}

/* Override navigation rail item hover overlay opacity */
.v-navigation-drawer .v-list-item:hover > .v-list-item__overlay {
  opacity: 0.1 !important;
}

/* Override expansion panel hover overlay opacity */
.v-expansion-panel:hover > .v-expansion-panel__overlay {
  opacity: 0.1 !important;
}

/* Override all overlay elements to have lower opacity */
.v-btn__overlay,
.v-card__overlay,
.v-list-item__overlay,
.v-chip__overlay,
.v-expansion-panel__overlay {
  opacity: 0 !important;
}

/* Set hover state for all overlay elements */
.v-btn:hover > .v-btn__overlay,
.v-card:hover > .v-card__overlay,
.v-list-item:hover > .v-list-item__overlay,
.v-chip:hover > .v-chip__overlay,
.v-expansion-panel:hover > .v-expansion-panel__overlay {
  opacity: 0.1 !important;
}

/* Specific overrides for todo items */
.todo-item:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

/* Override avatar hover overlay */
.v-avatar:hover > .v-avatar__overlay {
  opacity: 0.1 !important;
}
</style>
