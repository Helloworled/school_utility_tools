<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Reset Password</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <p class="mb-4">Enter your email, verification code, and new password below.</p>
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              @click:close="errorMessage = null"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" v-model="valid" @submit.prevent="handleResetPassword">
              <v-text-field
                v-model="email"
                :rules="[rules.required, rules.email]"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
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
              ></v-text-field>

              <v-text-field
                v-model="password"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required, rules.passwordStrength]"
                :type="showPassword ? 'text' : 'password'"
                label="New Password"
                name="password"
                prepend-icon="mdi-lock"
                @click:append="showPassword = !showPassword"
              ></v-text-field>

              <v-progress-linear
                v-if="password"
                :color="passwordStrength.color"
                :model-value="passwordStrength.value"
                height="7"
              ></v-progress-linear>
              <v-text v-if="password" class="text-caption mt-1">{{ passwordStrength.text }}</v-text>

              <v-text-field
                v-model="confirmPassword"
                :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required, rules.matchPassword]"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm New Password"
                name="confirmPassword"
                prepend-icon="mdi-lock"
                @click:append="showConfirmPassword = !showConfirmPassword"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="loading || !valid" :loading="loading" @click="handleResetPassword">Reset Password</v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <router-link :to="{ name: 'forgot-password', query: { email } }">Resend verification code</router-link>
          </v-card-text>
          <v-card-text class="text-center">
            <router-link to="/login">Back to Login</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form data
const email = ref('');
const code = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const valid = ref(true);
const loading = ref(false);
const errorMessage = ref(null);

// Get email from query parameter on mount
onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email;
  }
});

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || 'Invalid e-mail address';
  },
  codeLength: value => value.length === 6 || 'Verification code must be 6 digits',
  passwordStrength: value => {
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return true;
  },
  matchPassword: value => value === password.value || 'Passwords must match'
};

// Password strength indicator
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) {
    return { value: 0, color: 'grey', text: '' };
  }

  let strength = 0;
  if (pwd.length >= 8) strength += 20;
  if (pwd.length >= 12) strength += 20;
  if (/[A-Z]/.test(pwd)) strength += 20;
  if (/[a-z]/.test(pwd)) strength += 20;
  if (/[0-9]/.test(pwd)) strength += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) strength += 10;

  if (strength <= 20) {
    return { value: strength, color: 'red', text: 'Weak' };
  } else if (strength <= 40) {
    return { value: strength, color: 'orange', text: 'Fair' };
  } else if (strength <= 60) {
    return { value: strength, color: 'yellow', text: 'Good' };
  } else if (strength <= 80) {
    return { value: strength, color: 'light-green', text: 'Strong' };
  } else {
    return { value: strength, color: 'green', text: 'Very Strong' };
  }
});

// Handle reset password
const handleResetPassword = async () => {
  if (!valid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    await authStore.resetPassword(email.value, code.value, password.value);

    // Show success message
    alert('Your password has been reset successfully. Please login with your new password.');

    // Redirect to login page
    router.push('/login');
  } catch (error) {
    console.error('Reset password error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Failed to reset password. The verification code may be invalid or expired.';
  } finally {
    loading.value = false;
  }
};
</script>
