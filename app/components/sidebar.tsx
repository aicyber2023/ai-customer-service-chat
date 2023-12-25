import {useEffect, useRef} from "react";

import styles from "./home.module.scss";

import {IconButton} from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import ReturnIcon from "../icons/return.svg"
import ShareIcon from "../icons/share.svg"
import CloseIcon from "../icons/close.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import logo from "@/app/icons/logo.png"

import Locale from "../locales";

import {useAppConfig, useChatStore} from "../store";

import {
    MAX_SIDEBAR_WIDTH,
    MIN_SIDEBAR_WIDTH,
    NARROW_SIDEBAR_WIDTH,
    Path,
    REPO_URL,
} from "../constant";

import {Link, useNavigate} from "react-router-dom";
import {useMobileScreen} from "../utils";
import dynamic from "next/dynamic";
import {showConfirm, showToast} from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
    loading: () => null,
});

function useHotKey() {
    const chatStore = useChatStore();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.altKey || e.ctrlKey) {
                if (e.key === "ArrowUp") {
                    chatStore.nextSession(-1);
                } else if (e.key === "ArrowDown") {
                    chatStore.nextSession(1);
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });
}

function useDragSideBar() {
    const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

    const config = useAppConfig();
    const startX = useRef(0);
    const startDragWidth = useRef(config.sidebarWidth ?? 300);
    const lastUpdateTime = useRef(Date.now());

    const handleMouseMove = useRef((e: MouseEvent) => {
        if (Date.now() < lastUpdateTime.current + 50) {
            return;
        }
        lastUpdateTime.current = Date.now();
        const d = e.clientX - startX.current;
        const nextWidth = limit(startDragWidth.current + d);
        config.update((config) => (config.sidebarWidth = nextWidth));
    });

    const handleMouseUp = useRef(() => {
        startDragWidth.current = config.sidebarWidth ?? 300;
        window.removeEventListener("mousemove", handleMouseMove.current);
        window.removeEventListener("mouseup", handleMouseUp.current);
    });

    const onDragMouseDown = (e: MouseEvent) => {
        startX.current = e.clientX;

        window.addEventListener("mousemove", handleMouseMove.current);
        window.addEventListener("mouseup", handleMouseUp.current);
    };
    const isMobileScreen = useMobileScreen();
    const shouldNarrow =
        !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

    useEffect(() => {
        const barWidth = shouldNarrow
            ? NARROW_SIDEBAR_WIDTH
            : limit(config.sidebarWidth ?? 300);
        const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
        document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
    }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

    return {
        onDragMouseDown,
        shouldNarrow,
    };
}

export function SideBar(props: { className?: string }) {
    const chatStore = useChatStore();

    // drag side bar
    const {onDragMouseDown, shouldNarrow} = useDragSideBar();
    const navigate = useNavigate();
    const config = useAppConfig();

    const visitor = window.localStorage.getItem("visitor");

    useHotKey();

    return (
        <div
            className={`${styles.sidebar} ${props.className} ${
                shouldNarrow && styles["narrow-sidebar"]
            }`}
        >
            <div className={styles["sidebar-header"]} data-tauri-drag-region>
                <div className={styles["sidebar-title"]} data-tauri-drag-region>
                    数字员工
                </div>
                <div className={styles["sidebar-sub-title"]}>
                    Digital Employees
                </div>
                <div className={styles["sidebar-logo"] + " no-dark"}>
                    {/*<ChatGptIcon/>*/}
                    <img src={logo.src} width={44} height={44} style={{opacity:0.3}}/>
                </div>
            </div>

            {/*面具*/}
            {/*{*/}
            {/*    !visitor && <div className={styles["sidebar-header-bar"]}>*/}
            {/*        <IconButton*/}
            {/*            icon={<MaskIcon/>}*/}
            {/*            text={shouldNarrow ? undefined : Locale.Mask.Name}*/}
            {/*            className={styles["sidebar-bar-button"]}*/}
            {/*            onClick={() => navigate(Path.Masks, {state: {fromHome: false}})}*/}
            {/*            shadow*/}
            {/*        />*/}
            {/*    </div>*/}
            {/*}*/}

            {
                true && <div
                    className={styles["sidebar-body"]}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            navigate(Path.Home);
                        }
                    }}
                >
                    <ChatList narrow={shouldNarrow}/>
                </div>
            }
            <div className={styles["sidebar-tail"]}>
                <div className={styles["sidebar-actions"]}>
                    {/*<div className={styles["sidebar-action"] + " " + styles.mobile}>*/}
                    {/*    <IconButton */}
                    {/*        icon={<CloseIcon/>}*/}
                    {/*        onClick={async () => {*/}
                    {/*            if (await showConfirm(Locale.Home.DeleteChat)) {*/}
                    {/*                chatStore.deleteSession(chatStore.currentSessionIndex);*/}
                    {/*            }*/}
                    {/*        }}*/}
                    {/*    />*/}
                    {/*</div>*/}
                    {
                        !visitor && <div className={styles.hiddent_line}>
                            <Link to={Path.UserSettings}>
                                <IconButton icon={<SettingsIcon/>} shadow/>
                            </Link>
                        </div>
                    }
                </div>

                <div className={styles["sidebar-actions"]}>
                    {
                        !visitor && <div className={styles.hiddent_line}>
                            <Link to={Path.Masks}>
                                <IconButton icon={<AddIcon/>} text={shouldNarrow ? undefined : Locale.Home.NewChat} shadow/>
                            </Link>
                        </div>
                    }
                </div>

                <div className={styles["sidebar-actions"]}>
                    {
                        true && <div className={styles.hiddent_line}>
                            <Link to={Path.Home}>
                                <IconButton icon={<ReturnIcon/>} text={shouldNarrow ? undefined :!visitor?"退出登录":"去登录" } shadow onClick={() => {
                                    window.localStorage.removeItem("token");
                                    window.localStorage.removeItem("visitor");
                                    window.localStorage.removeItem("isAuth");
                                }
                                }/>
                            </Link>
                        </div>
                    }
                </div>



                {/*<div className={styles["sidebar-actions"]}>*/}
                {/*    <div >*/}
                {/*        <IconButton*/}
                {/*            icon={<CloseIcon/>}*/}
                {/*            text={shouldNarrow ? undefined : "退出登录"}*/}
                {/*            onClick={() => {*/}
                {/*                window.localStorage.removeItem("token");*/}
                {/*                window.localStorage.removeItem("visitor");*/}
                {/*                navigate("/");*/}
                {/*            }*/}
                {/*            }*/}
                {/*            shadow*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>

            <div
                className={styles["sidebar-drag"]}
                onMouseDown={(e) => onDragMouseDown(e as any)}
            >
                <DragIcon/>
            </div>
        </div>
    );
}
