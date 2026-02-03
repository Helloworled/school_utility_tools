<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Register</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
              @click:close="errorMessage = null"
              class="mb-4"
            >
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" v-model="valid" @submit.prevent="handleRegister">
              <v-text-field
                v-model="user_name"
                :rules="[rules.required, rules.minLength(3), rules.maxLength(50)]"
                label="Username"
                name="user_name"
                prepend-icon="mdi-account"
                type="text"
              ></v-text-field>

              <v-text-field
                v-model="email"
                :rules="[rules.required, rules.email]"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
              ></v-text-field>

              <v-text-field
                v-model="password"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required, rules.passwordStrength]"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
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
                label="Confirm Password"
                name="confirmPassword"
                prepend-icon="mdi-lock"
                @click:append="showConfirmPassword = !showConfirmPassword"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="loading || !valid" :loading="loading" @click="handleRegister">Register</v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            Already have an account? <router-link to="/login">Login</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form data
const user_name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const valid = ref(true);
const loading = ref(false);
const errorMessage = ref(null);

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  minLength: min => value => value.length >= min || `Must be at least ${min} characters`,
  maxLength: max => value => value.length <= max || `Must be at most ${max} characters`,
  email: value => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || 'Invalid e-mail address';
  },
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

// Handle register
const handleRegister = async () => {
  if (!valid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    await authStore.register({
      user_name: user_name.value,
      email: email.value,
      password: password.value
    });

    // Redirect to dashboard after successful registration
    router.push('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
