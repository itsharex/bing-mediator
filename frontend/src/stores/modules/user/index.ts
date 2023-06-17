import { ref } from "vue";
import { defineStore } from "pinia";
import { logger } from "@kirklin/logger";
import cookies from "@/utils/cookies";
import { sleep } from "@/utils/utils";
import sysConfigApi from "@/api/sysconf";
import { ApiResultCode } from "@/api/model/ApiResult";
import type { SysConfig } from "@/api/model/sysconf/SysConfig";

export const useUserStore = defineStore(
  "user-store",
  () => {
    const maxTryCreateConversationIdCount = 10;
    const userTokenCookieName = "_U";
    const randIpCookieName = "BingAI_Rand_IP";
    const authKeyCookieName = "BingAI_Auth_Key";

    const sysConfig = ref<SysConfig>();

    const getSysConfig = async () => {
      const res = await sysConfigApi.getSysConfig();
      if (res.code === ApiResultCode.OK) {
        sysConfig.value = {
          ...sysConfig.value,
          ...res.data,
        };
      }
      return res;
    };

    const getConversationExpiry = () => {
      const B = new Date();
      B.setMinutes(B.getMinutes() + CIB.config.sydney.expiryInMinutes);
      return B;
    };

    const tryCreateConversationId = async (tryCount = 0) => {
      if (tryCount >= maxTryCreateConversationIdCount) {
        logger.info(`已重试 ${tryCount} 次，自动创建停止`);
        return;
      }
      const conversationRes = await fetch("/turing/conversation/create", {
        credentials: "include",
      })
        .then(res => res.json())
        .catch(_ => "error");
      if (conversationRes?.result?.value === "Success") {
        logger.info("成功创建会话ID : ", conversationRes.conversationId);
        CIB.manager.conversation.updateId(conversationRes.conversationId, getConversationExpiry(), conversationRes.clientId, conversationRes.conversationSignature);
      } else {
        await sleep(300);
        tryCount += 1;
        logger.info(`开始第 ${tryCount} 次重试创建会话ID`);
        cookies.set(randIpCookieName, "", -1);
        tryCreateConversationId(tryCount);
      }
    };

    const getUserToken = () => {
      return cookies.get(userTokenCookieName) || "";
    };

    const checkUserToken = () => {
      const token = getUserToken();
      if (!token) {
        // 未登录不显示历史记录
        CIB.config.features.enableGetChats = false;
        CIB.vm.sidePanel.isVisibleMobile = false;
        CIB.vm.sidePanel.isVisibleDesktop = false;
        // 创建会话id
        tryCreateConversationId();
      }
    };

    const saveUserToken = (token: string) => {
      cookies.set(userTokenCookieName, token, 7 * 24 * 60, "/");
    };

    const setAuthKey = (authKey: string) => {
      cookies.set(authKeyCookieName, authKey);
    };

    const clearCache = async () => {
      // del storage
      localStorage.clear();
      sessionStorage.clear();
      // del sw cache
      const cacheKeys = await caches.keys();
      for (const cacheKey of cacheKeys) {
        await caches.delete(cacheKey);
        logger.info(`del cache : ${cacheKey}`);
        // await caches.open(cacheKey).then(async (cache) => {
        //   const requests = await cache.keys();
        //   return await Promise.all(
        //     requests.map((request) => {
        //       console.log(`del cache : `, request.url);
        //       return cache.delete(request);
        //     })
        //   );
        // });
      }
    };

    const resetCache = async () => {
      cookies.set(userTokenCookieName, "", -1);
      cookies.set(randIpCookieName, "", -1);
      cookies.set(authKeyCookieName, "", -1);
      await clearCache();
    };

    return {
      sysConfig,
      getSysConfig,
      getUserToken,
      checkUserToken,
      saveUserToken,
      resetCache,
      setAuthKey,
    };
  },
  {
    persist: {
      key: "user-store",
      storage: localStorage,
      paths: [],
    },
  },
);
