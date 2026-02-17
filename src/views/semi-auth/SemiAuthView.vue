<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card v-if="!authStore.isAuthenticated" class="elevation-12 semi-auth-card">
          <v-toolbar color="primary" dark class="semi-auth-toolbar">
            <v-toolbar-title class="text-h5">Semi-authentication</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="goBack">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text class="pt-6">
            <SemiAuthLogin @authenticated="handleAuthenticated" />
          </v-card-text>
        </v-card>

        <v-card v-else class="elevation-12 semi-auth-card">
          <v-toolbar color="warning" dark class="semi-auth-toolbar">
            <v-toolbar-title class="text-h5">Access Denied</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="pt-6">
            <v-alert
              type="warning"
              class="mb-4"
              icon="mdi-lock"
              density="compact"
            >
              You are already authenticated and have full access to all resources.
              Semi-authentication is not required.
            </v-alert>
            <v-btn color="primary" block @click="goBack">
              Go Back
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import SemiAuthLogin from '@/components/SemiAuthLogin.vue';

const router = useRouter();
const authStore = useAuthStore();

const handleAuthenticated = () => {
  // Redirect to semi-auth file view after successful semi-authentication
  router.push('/semi-auth/files');
};

const goBack = () => {
  // Go back to previous page or home
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
.semi-auth-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.semi-auth-toolbar {
  padding: 1.5rem;
}
</style>
