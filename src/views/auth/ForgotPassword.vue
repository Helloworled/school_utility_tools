<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Forgot Password</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-card-text>
            <p class="mb-4">You will be redirected to the email login page where you can send a verification code to reset your password.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="goToEmailLogin">Continue</v-btn>
          </v-card-actions>
          <v-card-text class="text-center">
            <router-link to="/login" class="text-decoration-none">Back to Login</router-link>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// Go to email login page
const goToEmailLogin = () => {
  router.push('/email-login');
};
</script>
