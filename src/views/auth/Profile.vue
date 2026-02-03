<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Profile</h1>
      </v-col>
    </v-row>

    <v-row v-if="errorMessage">
      <v-col cols="12">
        <v-alert
          type="error"
          dismissible
          @click:close="errorMessage = null"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>Profile Information</v-card-title>
          <v-card-text>
            <v-form ref="profileForm" v-model="profileValid">
              <v-row>
                <v-col cols="12" class="text-center">
                  <v-avatar size="150" color="grey lighten-2">
                    <img v-if="user && user.avatar" :src="user.avatar" alt="Avatar">
                    <v-icon v-else size="100">mdi-account</v-icon>
                  </v-avatar>
                </v-col>
              </v-row>

              <v-text-field
                v-model="user_name"
                :rules="[rules.required, rules.minLength(3), rules.maxLength(50)]"
                label="Username"
                prepend-icon="mdi-account"
              ></v-text-field>

              <v-text-field
                v-model="email"
                label="Email"
                prepend-icon="mdi-email"
                disabled
              ></v-text-field>

              <v-text-field
                v-model="avatar"
                label="Avatar URL"
                prepend-icon="mdi-image"
                hint="Enter a URL for your avatar image"
                persistent-hint
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!profileValid || loading" :loading="loading" @click="updateProfile">Update Profile</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Change Password</v-card-title>
          <v-card-text>
            <v-form ref="passwordForm" v-model="passwordValid">
              <v-text-field
                v-model="currentPassword"
                :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required]"
                :type="showCurrentPassword ? 'text' : 'password'"
                label="Current Password"
                prepend-icon="mdi-lock"
                @click:append="showCurrentPassword = !showCurrentPassword"
              ></v-text-field>

              <v-text-field
                v-model="newPassword"
                :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required, rules.passwordStrength]"
                :type="showNewPassword ? 'text' : 'password'"
                label="New Password"
                prepend-icon="mdi-lock"
                @click:append="showNewPassword = !showNewPassword"
              ></v-text-field>

              <v-progress-linear
                v-if="newPassword"
                :color="passwordStrength.color"
                :model-value="passwordStrength.value"
                height="7"
              ></v-progress-linear>
              <v-text v-if="newPassword" class="text-caption mt-1">{{ passwordStrength.text }}</v-text>

              <v-text-field
                v-model="confirmPassword"
                :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required, rules.matchPassword]"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm New Password"
                prepend-icon="mdi-lock"
                @click:append="showConfirmPassword = !showConfirmPassword"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!passwordValid || loading" :loading="loading" @click="changePassword">Change Password</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="handleLogout">Logout</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Form data
const user_name = ref('');
const email = ref('');
const avatar = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const profileValid = ref(true);
const passwordValid = ref(true);
const loading = ref(false);
const errorMessage = ref(null);

// Get user from store
const user = computed(() => authStore.user);

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  minLength: min => value => value.length >= min || `Must be at least ${min} characters`,
  maxLength: max => value => value.length <= max || `Must be at most ${max} characters`,
  passwordStrength: value => {
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return true;
  },
  matchPassword: value => value === newPassword.value || 'Passwords must match'
};

// Password strength indicator
const passwordStrength = computed(() => {
  const pwd = newPassword.value;
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

// Initialize form with user data
onMounted(() => {
  if (user.value) {
    user_name.value = user.value.user_name || '';
    email.value = user.value.email || '';
    avatar.value = user.value.avatar || '';
  }
});

// Update profile
const updateProfile = async () => {
  if (!profileValid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    const profileData = {
      user_name: user_name.value
    };
    
    // Only include avatar if it has a value, otherwise send null to clear it
    if (avatar.value.trim() !== '') {
      profileData.avatar = avatar.value;
    } else {
      profileData.avatar = null;
    }
    await authStore.updateProfile(profileData);

    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Update profile error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Failed to update profile. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Change password
const changePassword = async () => {
  if (!passwordValid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    await authStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });

    alert('Password changed successfully! Please login again.');

    // Clear password fields
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    
    // Redirect to login page
    router.push('/login');
  } catch (error) {
    console.error('Change password error:', error);
    // Set error message from store or use default
    errorMessage.value = authStore.error || 'Failed to change password. Please check your current password and try again.';
  } finally {
    loading.value = false;
  }
};

// Logout
const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>
