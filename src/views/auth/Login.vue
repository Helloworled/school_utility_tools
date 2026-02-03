<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12 login-card">
          <v-toolbar color="primary" dark class="login-toolbar">
            <v-toolbar-title class="text-h5">Login</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text class="pt-6">
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              @click:close="errorMessage = null"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="user_name"
                :rules="[rules.required]"
                label="Username"
                name="user_name"
                prepend-icon="mdi-account"
                type="text"
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="password"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required]"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                name="password"
                prepend-icon="mdi-lock"
                @click:append="showPassword = !showPassword"
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <div class="checkbox-group">
                <v-checkbox
                  v-model="rememberMe"
                  label="Remember me"
                  color="primary"
                  hide-details
                  class="mb-4 remember-checkbox"
                ></v-checkbox>
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions class="flex-column">
            <v-btn
              color="primary"
              :disabled="loading"
              :loading="loading"
              @click="handleLogin"
              block
              size="large"
              class="mb-3"
            >
              Login
            </v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <router-link to="/forgot-password" class="text-decoration-none">Forgot password?</router-link>
          </v-card-text>
          <v-card-text class="text-center">
            <router-link to="/email-login" class="text-decoration-none">Login with verification code</router-link>
          </v-card-text>
          <v-card-text class="text-center">
            Don't have an account? <router-link to="/register" class="text-decoration-none">Register</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form data
const user_name = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const valid = ref(true);
const loading = ref(false);
const errorMessage = ref(null);

// Validation rules
const rules = {
  required: value => !!value || 'This field is required'
};

// Handle login
const handleLogin = async () => {
  if (!valid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    await authStore.login({
      user_name: user_name.value,
      password: password.value,
      rememberMe: rememberMe.value
    });

    // Redirect to the page the user was trying to access or dashboard
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  } catch (error) {
    console.error('Login error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.login-toolbar {
  padding: 1.5rem;
}

.v-text-field :deep(.v-field__outline) {
  border-radius: 8px;
}

.v-btn {
  border-radius: 8px !important;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 复选框样式优化 */
.checkbox-group {
  padding: 0.5rem 0;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.remember-checkbox :deep(.v-selection-control) {
  min-height: 48px;
}

.remember-checkbox :deep(.v-label) {
  font-size: 1rem;
  font-weight: 500;
  color: #1976D2;
}

.remember-checkbox :deep(.v-selection-control__wrapper) {
  width: 24px;
  height: 24px;
}

.remember-checkbox :deep(.v-checkbox) {
  width: 24px;
  height: 24px;
}

/* 链接样式优化 */
.text-decoration-none {
  color: #1976D2;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
}

.text-decoration-none:hover {
  color: #1565C0;
  text-decoration: underline;
}
</style>
