<template>
  <div class="semi-auth-login">
    <v-alert
      v-if="authStore.isAuthenticated"
      type="warning"
      class="mb-4"
      icon="mdi-lock"
      density="compact"
    >
      You are already authenticated and have full access to all resources.
      Semi-authentication is not required.
    </v-alert>

    <v-alert
      v-else
      type="info"
      class="mb-4"
      icon="mdi-information"
      density="compact"
    >
      Semi-authentication allows you to access restricted resources with user consent.
      Please enter a username to request a verification code.
    </v-alert>

    <div v-if="!authStore.isAuthenticated && !requestSent" class="step-1">
      <v-text-field
        v-model="username"
        label="Username"
        placeholder="Enter username"
        prepend-icon="mdi-account"
        variant="outlined"
        @keyup.enter="requestCode"
        :loading="loading"
      ></v-text-field>

      <v-btn
        @click="requestCode"
        :disabled="loading || !username || cooldownRemaining > 0"
        color="primary"
        block
        size="large"
        class="mb-3"
      >
        <v-icon left>mdi-send</v-icon>
        {{ loading ? 'Sending...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Request Verification Code' }}
      </v-btn>
    </div>

    <div v-else class="step-2">
      <v-alert
        type="success"
        class="mb-4"
        icon="mdi-check-circle"
        density="compact"
      >
        A verification code has been sent to <strong>{{ username }}</strong>.
        Please ask them to provide it to you.
      </v-alert>

      <v-text-field
        v-model="code"
        label="Verification Code"
        placeholder="Enter 6-character code"
        prepend-icon="mdi-shield-check"
        variant="outlined"
        maxlength="6"
        @keyup.enter="verify"
        :loading="loading"
      ></v-text-field>

      <v-btn
        @click="verify"
        :disabled="loading || !code"
        color="primary"
        block
        size="large"
        class="mb-3"
      >
        <v-icon left>mdi-check</v-icon>
        {{ loading ? 'Verifying...' : 'Verify' }}
      </v-btn>

      <v-btn
        @click="reset"
        color="grey"
        block
        size="large"
        variant="outlined"
      >
        <v-icon left>mdi-cancel</v-icon>
        Cancel
      </v-btn>
    </div>

    <v-alert
      v-if="error"
      type="error"
      class="mt-3"
      density="compact"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
import { useSemiAuthStore } from '../stores/semiAuth';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'SemiAuthLogin',
  setup(props, { emit }) {
    const authStore = useAuthStore();
    const semiAuthStore = useSemiAuthStore();
    const username = ref('');
    const code = ref('');
    const requestSent = ref(false);
    const loading = ref(false);
    const error = ref(null);
    const cooldownRemaining = ref(0);
    let cooldownInterval = null;

    const requestCode = async () => {
      if (!username.value) {
        error.value = 'Please enter a username';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await semiAuthStore.requestVerificationCode(username.value);
        requestSent.value = true;
        startCooldown();
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to request verification code';
      } finally {
        loading.value = false;
      }
    };

    const startCooldown = () => {
      cooldownRemaining.value = 30;
      cooldownInterval = setInterval(() => {
        cooldownRemaining.value--;
        if (cooldownRemaining.value <= 0) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
      }, 1000);
    };

    onUnmounted(() => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    });

    // Initialize semi-auth state from storage on mount
    semiAuthStore.initializeFromStorage();

    const verify = async () => {
      if (!code.value) {
        error.value = 'Please enter the verification code';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await semiAuthStore.verifyCode(code.value);
        emit('authenticated');
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to verify code';
      } finally {
        loading.value = false;
      }
    };

    const reset = () => {
      username.value = '';
      code.value = '';
      requestSent.value = false;
      error.value = null;
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    };

    return {
      authStore,
      username,
      code,
      requestSent,
      loading,
      error,
      cooldownRemaining,
      requestCode,
      verify,
      reset
    };
  },
  emits: ['authenticated']
};
</script>
