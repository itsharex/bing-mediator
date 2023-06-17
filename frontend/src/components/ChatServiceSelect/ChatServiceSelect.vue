<script setup lang="ts">
import { NButton, NInput, NModal, NTable, NTag, useMessage } from "naive-ui";
import { storeToRefs } from "pinia";
import { type SydneyConfig, useChatStore } from "@/stores/modules/chat";

const chatStore = useChatStore();
const { isShowChatServiceSelectModal, sydneyConfigs, selectedSydneyBaseUrl } = storeToRefs(chatStore);

const message = useMessage();

const checkSydneyConfig = async (config: SydneyConfig) => {
  config.isUsable = undefined;
  config.delay = undefined;
  const checkResult = await chatStore.checkSydneyConfig(config);
  if (checkResult.errorMsg) {
    message.error(checkResult.errorMsg);
  }
  config.isUsable = checkResult.isUsable;
  config.delay = checkResult.delay;
};

const selectSydneyConfig = (config: SydneyConfig) => {
  selectedSydneyBaseUrl.value = config.baseUrl;
  CIB.config.sydney.baseUrl = config.baseUrl;
  isShowChatServiceSelectModal.value = false;
};

const handleChangeSydneyConfig = (config: SydneyConfig) => {
  if (!config.baseUrl) {
    return;
  }
  if (!config.baseUrl.startsWith("https://")) {
    message.error("请填写 https 开头的正确链接");
    return;
  }
  return checkSydneyConfig(config);
};
</script>

<template>
  <NModal v-model:show="isShowChatServiceSelectModal" class="w-11/12 lg:w-[900px]" preset="card" title="聊天服务器设置">
    <NTable striped>
      <tbody>
        <tr v-for="(config, index) in sydneyConfigs" :key="index">
          <td>
            <span v-if="config.isCus" class="hidden lg:block">{{ config.label }}</span>
            <span v-else>{{ config.label }}</span>
            <NInput v-if="config.isCus" v-model:value="config.baseUrl" class="lg:hidden" placeholder="自定义聊天服务器链接" @change="handleChangeSydneyConfig(config)" />
          </td>
          <td class="hidden lg:table-cell">
            <NInput v-if="config.isCus" v-model:value="config.baseUrl" placeholder="自定义聊天服务器链接" @change="handleChangeSydneyConfig(config)" />
            <span v-else>{{ config.baseUrl }}</span>
          </td>
          <td>
            <div v-if="config.baseUrl && config.isUsable === undefined && config.delay === undefined" class="flex justify-center items-center flex-wrap gap-2">
              <NButton tertiary :loading="true" size="small" type="info" />
            </div>
            <div v-else-if="config.baseUrl" class="flex justify-center items-center flex-wrap gap-2" @click="checkSydneyConfig(config)">
              <NTag v-if="config.isUsable === false" type="error" class="cursor-pointer">
                不可用
              </NTag>
              <NTag v-if="config.delay" type="success" class="cursor-pointer">
                {{ config.delay }} ms
              </NTag>
            </div>
          </td>
          <td>
            <div class="flex justify-center items-center flex-wrap gap-2">
              <NButton class="hidden lg:table-cell" secondary @click="checkSydneyConfig(config)">
                检测
              </NButton>
              <NButton v-if="config.baseUrl === selectedSydneyBaseUrl" secondary type="success">
                当前
              </NButton>
              <NButton v-else secondary type="info" @click="selectSydneyConfig(config)">
                选择
              </NButton>
            </div>
          </td>
        </tr>
      </tbody>
    </NTable>
  </NModal>
</template>
