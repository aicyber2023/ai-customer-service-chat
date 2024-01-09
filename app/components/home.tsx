"use client";
import cover from "../icons/fengmian.jpg";
import logo from "../icons/logo.png";
require("../polyfill");

import React, { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/logo.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";
import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { api } from "../client/api";
import { useAccessStore, useChatStore } from "../store";
import baseConfig from "@/app/config/url";
import { Avatar } from "@/app/components/emoji";
import LogoIcon from "@/app/icons/logo.png";
import axios from "axios";
export function Loading(props: { noLogo?: boolean; id?: string }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {/*{!props.noLogo && <img src={`${baseConfig.imgURL}/de/digitalEmployee/showCompanyAvatar/${props.id}`} alt="" width={40} height={40} style={{borderRadius:"20px"}}/>}*/}
      {!props.noLogo && (
        <img
          src={logo.src}
          alt=""
          width={40}
          height={40}
          style={{ borderRadius: "20px" }}
        />
      )}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const UserSettings = dynamic(
  async () => (await import("./userSettings")).UserSettings,
  {
    loading: () => <Loading noLogo />,
  },
);

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const Share = dynamic(async () => (await import("./share")).Share, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl + "/css2?family=Noto+Sans:wght@300;400;700;900&display=swap";
  document.head.appendChild(linkEl);
};

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  // const isAuth = location.pathname === Path.Auth;
  // 登录用户
  // const [isAuth,setIsAuth] = useState(Boolean();

  const isAuth = window.localStorage.getItem("token");

  const isMobileScreen = useMobileScreen();

  // 获取url参数
  const query = new URLSearchParams(location.search);
  // 是否来自测试
  const isTest = Boolean(query.get("isTest"));
  // 访客
  const isVisitor = Boolean(query.get("isVisitor"));
  const createBy = query.get("createBy");
  // //console.log("isTest",isTest);
  // //console.log("isTest",isVisitor);
  const [isCover, setIsCover] = useState(true);
  const chatStore = useChatStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  //是否为测试
  useEffect(() => {
    localStorage.setItem("isTest", String(isTest));
    localStorage.setItem("isVisitor", String(isVisitor));
    if (createBy) {
      window.localStorage.setItem("createBy", createBy);
    }
    loadAsyncGoogleFont();
    // setIsAuth(Boolean(window.localStorage.getItem("token")));
    // 是否为访客状态
    // if (isVisitor) {
    //     window.localStorage.setItem("isVisitor", "true")
    //     window.localStorage.removeItem("token");
    //     //console.log("访客");
    //     // setIsAuth(false);
    // } else {
    //     window.localStorage.removeItem("isVisitor");
    // }
    // // 是否为登录状态
    // if (isAuth) {
    //     window.localStorage.setItem("isAuth", "true")
    //     //console.log("登录");
    // } else {
    //     window.localStorage.removeItem("isAuth");
    // }
    // // 是否为测试
    // if (isTest) {
    //     window.localStorage.setItem("isTest", "true")
    //     window.localStorage.removeItem("isAuth");
    //     window.localStorage.removeItem("token");
    //     // setIsAuth(false);
    //     //console.log("测试");
    // } else {
    //     window.localStorage.removeItem("isTest");
    // }

    //console.log("isAuth:", isAuth, "isVisitor", isVisitor, "isTest", isTest);
    setTimeout(() => {
      setIsCover(false);
    }, 5000);
  }, []);

  // @ts-ignore
  return (
    <div
      className={
        styles.container +
        ` ${
          config.tightBorder && !isMobileScreen
            ? styles["tight-container"]
            : styles.container
        } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`
      }
    >
      {/*!isAuth && !visitor*/}
      {isTest || isAuth || isVisitor ? (
        <>
          {isAuth && !query.get("isTest") && !query.get("isVisitor") && (
            <SideBar className={isHome ? styles["sidebar-show"] : ""} />
          )}

          {
            //(windowWidth < 560 && isCover)
            false ? (
              <div
                className={styles["window-content"]}
                id={SlotID.AppBody}
                style={{ width: "100%" }}
              >
                <div>
                  <img
                    src={cover.src}
                    alt=""
                    style={{ width: "100vw", height: "100vh" }}
                  />
                </div>
              </div>
            ) : (
              <div
                className={styles["window-content"]}
                id={SlotID.AppBody}
                style={{ width: "100%" }}
              >
                <Routes>
                  {/*设卡拦截到登录页面*/}
                  {/*<Route path={Path.Login} element={<Login/>}/>*/}
                  <Route path={Path.Home} element={<Chat />} />
                  <Route path={Path.NewChat} element={<NewChat />} />
                  <Route path={Path.Masks} element={<MaskPage />} />
                  <Route path={Path.Chat} element={<Chat />} />
                  <Route path={Path.Share} element={<Share />} />
                  <Route path={Path.UserSettings} element={<UserSettings />} />
                  {/*注释掉设置页面*/}
                  <Route path={Path.Settings} element={<Settings />} />
                </Routes>
              </div>
            )
          }
        </>
      ) : (
        <>
          <AuthPage />
        </>
      )}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    //console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
