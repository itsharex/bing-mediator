<script setup lang="ts">
import Chat from "./components/Chat/Chat.vue";
import ChatNav from "@/components/ChatNav/ChatNav.vue";
import ChatPromptStore from "@/components/ChatPromptStore/ChatPromptStore.vue";
</script>

<template>
  <main>
    <ChatNav />
    <ChatPromptStore />
    <Chat />
  </main>
</template>
