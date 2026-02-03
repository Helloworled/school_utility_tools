<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Email Login</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <p class="mb-4">Enter your email and verification code to login.</p>
            <v-alert
              v-if="successMessage"
              type="success"
              dismissible
              @click:close="successMessage = null"
              class="mb-4"
            >
              {{ successMessage }}
            </v-alert>
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              @click:close="errorMessage = null"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" v-model="valid" @submit.prevent="handleEmailLogin">
              <v-text-field
                v-model="email"
                :rules="[rules.required, rules.email]"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="code"
                :rules="[rules.required, rules.codeLength]"
                label="Verification Code"
                name="code"
                prepend-icon="mdi-key"
                type="text"
                maxlength="6"
                counter
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <v-btn
                color="secondary"
                :disabled="sendingCode || !isEmailValid"
                :loading="sendingCode"
                @click="handleSendCode"
                block
                class="mb-3"
              >
                {{ sendingCode ? 'Sending...' : 'Send Verification Code' }}
              </v-btn>

              <v-checkbox
                v-model="rememberMe"
                label="Remember me"
                color="primary"
                hide-details
                class="mb-3"
              ></v-checkbox>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="loading || !valid" :loading="loading" @click="handleEmailLogin" block>Login</v-btn>
          </v-card-actions>
          <v-card-text class="text-center pt-4">
            <router-link to="/login" class="text-decoration-none">Back to Login</router-link>
          </v-card-text>
          <v-card-text v-if="showResetPassword" class="text-center">
            <router-link to="/reset-password" class="text-decoration-none">Reset Password</router-link>
          </v-card-text>
          <v-card-text class="text-center">
            <router-link to="/forgot-password" class="text-decoration-none">Forgot Password?</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form data
const email = ref('');
const code = ref('');
const rememberMe = ref(false);
const valid = ref(true);
const loading = ref(false);
const sendingCode = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

// Timer data
const codeSentTime = ref(null);
const showResetPassword = ref(false);
let timerInterval = null;

// Computed property to check if email is valid
const isEmailValid = computed(() => {
  const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(email.value);
});

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || 'Invalid e-mail address';
  },
  codeLength: value => value.length === 6 || 'Verification code must be 6 digits'
};

// Get email from query parameter on mount
onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email;
  }
});

// Handle send verification code
const handleSendCode = async () => {
  if (!isEmailValid.value) return;

  sendingCode.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  
  try {
    await authStore.sendVerificationCode(email.value, 'login');
    successMessage.value = 'Verification code sent successfully! Please check your email.';
    
    // Start timer for 15 minutes
    codeSentTime.value = Date.now();
    showResetPassword.value = false;
    
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Set new timer to show reset password link after 15 minutes
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - codeSentTime.value;
      if (elapsed >= 15 * 60 * 1000) { // 15 minutes in milliseconds
        showResetPassword.value = true;
        clearInterval(timerInterval);
      }
    }, 1000); // Check every second
  } catch (error) {
    console.error('Send code error:', error);
    errorMessage.value = authStore.error || 'Failed to send verification code. Please try again.';
  } finally {
    sendingCode.value = false;
  }
};

// Handle email login
const handleEmailLogin = async () => {
  if (!valid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    await authStore.emailLogin(email.value, code.value, rememberMe.value);

    // Redirect to dashboard
    router.push('/');
  } catch (error) {
    console.error('Email login error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Email login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Clean up timer when component is unmounted
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>
