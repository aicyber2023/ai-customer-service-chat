import {useDebouncedCallback} from "use-debounce";
import React, {
    useState,
    useRef,
    useEffect,
    useMemo,
    useCallback,
    Fragment,
} from "react";
import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import PromptIcon from "../icons/prompt.svg";
import MaskIcon from "../icons/mask.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import Share from "../icons/share.svg"
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import EditIcon from "../icons/rename.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import RobotIcon from "../icons/robot.svg";
import baseConfig from "../config/url"

import {
    ChatMessage,
    SubmitKey,
    useChatStore,
    useChatStoreTest,
    useChatStoreVisitor,
    BOT_HELLO,
    createMessage,
    useAccessStore,
    Theme,
    useAppConfig,
    DEFAULT_TOPIC,
    ModelType,
} from "../store";

import {
    copyToClipboard,
    selectOrCopy,
    autoGrowTextArea,
    useMobileScreen,
} from "../utils";

import dynamic from "next/dynamic";

import {ChatControllerPool} from "../client/controller";
import {Prompt, usePromptStore} from "../store/prompt";
import Locale from "../locales";

import {IconButton} from "./button";
import styles from "./chat.module.scss";

import {
    List,
    ListItem,
    Modal,
    Selector,
    showConfirm,
    showPrompt,
    showToast,
} from "./ui-lib";
import {useLocation, useNavigate} from "react-router-dom";
import {
    CHAT_PAGE_SIZE,
    LAST_INPUT_KEY,
    MAX_RENDER_MSG_COUNT,
    Path,
    REQUEST_TIMEOUT_MS,
} from "../constant";
import {Avatar} from "./emoji";
import {ContextPrompts, MaskAvatar, MaskConfig} from "./mask";
import {useMaskStore} from "../store/mask";
import {ChatCommandPrefix, useChatCommand, useCommand} from "../command";
import {prettyObject} from "../utils/format";
import {ExportMessageModal} from "./exporter";
import {getClientConfig} from "../config/client";
import axios from "axios";
import {Models} from "@/app/client/api";
import baseEmployeeAvatar from "@/app/icons/baseEmployeeAvatar.png"
import {CloseIcon} from "next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
    loading: () => <LoadingIcon/>,
});

export function SessionConfigModel(props: { onClose: () => void }) {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore = query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());
    const session = chatStore.currentSession();
    const maskStore = useMaskStore();
    const navigate = useNavigate();

    return (
        <div className="modal-mask">
            <Modal
                title={Locale.Context.Edit}
                onClose={() => props.onClose()}
                actions={[
                    <IconButton
                        key="reset"
                        icon={<ResetIcon/>}
                        bordered
                        text={Locale.Chat.Config.Reset}
                        onClick={async () => {
                            if (await showConfirm(Locale.Memory.ResetConfirm)) {
                                chatStore.updateCurrentSession(
                                    (session) => (session.memoryPrompt = ""),
                                );
                            }
                        }}
                    />,
                    <IconButton
                        key="copy"
                        icon={<CopyIcon/>}
                        bordered
                        text={Locale.Chat.Config.SaveAs}
                        onClick={() => {
                            navigate(Path.Masks);
                            setTimeout(() => {
                                maskStore.create(session.mask);
                            }, 500);
                        }}
                    />,
                ]}
            >
                <MaskConfig
                    mask={session.mask}
                    updateMask={(updater) => {
                        const mask = {...session.mask};
                        updater(mask);
                        chatStore.updateCurrentSession((session) => (session.mask = mask));
                    }}
                    shouldSyncFromGlobal
                    extraListItems={
                        session.mask.modelConfig.sendMemory ? (
                            <ListItem
                                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
                            ></ListItem>
                        ) : (
                            <></>
                        )
                    }
                ></MaskConfig>
            </Modal>
        </div>
    );
}

function PromptToast(props: {
    showToast?: boolean;
    showModal?: boolean;
    setShowModal: (_: boolean) => void;
}) {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore = query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());
    const session = chatStore.currentSession();
    const context = session.mask.context;

    return (
        <div className={styles["prompt-toast"]} key="prompt-toast">
            {/*{props.showToast && (*/}
            {/*  <div*/}
            {/*    className={styles["prompt-toast-inner"] + " clickable"}*/}
            {/*    role="button"*/}
            {/*    onClick={() => props.setShowModal(true)}*/}
            {/*  >*/}
            {/*    <BrainIcon />*/}
            {/*    <span className={styles["prompt-toast-content"]}>*/}
            {/*      {Locale.Context.Toast(context.length)}*/}
            {/*    </span>*/}
            {/*  </div>*/}
            {/*)}*/}
            {/*{props.showModal && (*/}
            {/*  <SessionConfigModel onClose={() => props.setShowModal(false)} />*/}
            {/*)}*/}
        </div>
    );
}

function useSubmitHandler() {
    const config = useAppConfig();
    const submitKey = config.submitKey;
    const isComposing = useRef(false);

    useEffect(() => {
        const onCompositionStart = () => {
            isComposing.current = true;
        };
        const onCompositionEnd = () => {
            isComposing.current = false;
        };

        window.addEventListener("compositionstart", onCompositionStart);
        window.addEventListener("compositionend", onCompositionEnd);

        return () => {
            window.removeEventListener("compositionstart", onCompositionStart);
            window.removeEventListener("compositionend", onCompositionEnd);
        };
    }, []);

    const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return false;
        if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
            return false;
        return (
            (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
            (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
            (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
            (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
            (config.submitKey === SubmitKey.Enter &&
                !e.altKey &&
                !e.ctrlKey &&
                !e.shiftKey &&
                !e.metaKey)
        );
    };

    return {
        submitKey,
        shouldSubmit,
    };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
    prompts: RenderPompt[];
    onPromptSelect: (prompt: RenderPompt) => void;
}) {
    const noPrompts = props.prompts.length === 0;
    const [selectIndex, setSelectIndex] = useState(0);
    const selectedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectIndex(0);
    }, [props.prompts.length]);


    const xx = function (callback: (ip: string) => void): void {
        const ip_dups: { [ip: string]: boolean } = {};
        const RTCPeerConnection = window.RTCPeerConnection
            || window.RTCPeerConnection
            || window.RTCPeerConnection;
        const useWebKit = !!window.RTCPeerConnection;
        const mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };
        const servers = {
            iceServers: [
                {urls: "stun:stun.services.mozilla.com"},
                {urls: "stun:stun.l.google.com:19302"},
            ]
        };
        // @ts-ignore
        const pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate: string): void {
            const ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
            const hasIp = ip_regex.exec(candidate);
            if (hasIp) {
                // @ts-ignore
                const ip_addr = ip_regex.exec(candidate)[1];
                if (ip_dups[ip_addr] === undefined)
                    callback(ip_addr);
                ip_dups[ip_addr] = true;
            }
        }

        pc.onicecandidate = function (ice: RTCPeerConnectionIceEvent): void {
            if (ice.candidate) {
                handleCandidate(ice.candidate.candidate);
            }
        };

        pc.createDataChannel("");

        pc.createOffer(function (result: RTCSessionDescriptionInit): void {
            pc.setLocalDescription(result, function () {
            }, function () {
            });
        }, function () {
        });

        setTimeout(function () {
            // @ts-ignore
            const lines = pc.localDescription.sdp.split('\n');
            lines.forEach(function (line: string): void {
                if (line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);
    }
    useEffect(() => {
        xx(function (ip) {
            console.log(ip);
        });
        console.log("sss")
    }, []);


    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
                return;
            }
            // arrow up / down to select prompt
            const changeIndex = (delta: number) => {
                e.stopPropagation();
                e.preventDefault();
                const nextIndex = Math.max(
                    0,
                    Math.min(props.prompts.length - 1, selectIndex + delta),
                );
                setSelectIndex(nextIndex);
                selectedRef.current?.scrollIntoView({
                    block: "center",
                });
            };

            if (e.key === "ArrowUp") {
                changeIndex(1);
            } else if (e.key === "ArrowDown") {
                changeIndex(-1);
            } else if (e.key === "Enter") {
                const selectedPrompt = props.prompts.at(selectIndex);
                if (selectedPrompt) {
                    props.onPromptSelect(selectedPrompt);
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.prompts.length, selectIndex]);

    if (noPrompts) return null;
    return (
        <div className={styles["prompt-hints"]}>
            {props.prompts.map((prompt, i) => (
                <div
                    ref={i === selectIndex ? selectedRef : null}
                    className={
                        styles["prompt-hint"] +
                        ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
                    }
                    key={prompt.title + i.toString()}
                    onClick={() => props.onPromptSelect(prompt)}
                    onMouseEnter={() => setSelectIndex(i)}
                >
                    <div className={styles["hint-title"]}>{prompt.title}</div>
                    <div className={styles["hint-content"]}>{prompt.content}</div>
                </div>
            ))}
        </div>
    );
}

function ClearContextDivider() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore =query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());

    return (
        <div
            className={styles["clear-context"]}
            onClick={() =>
                chatStore.updateCurrentSession(
                    (session) => (session.clearContextIndex = undefined),
                )
            }
        >
            <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
            <div className={styles["clear-context-revert-btn"]}>
                {Locale.Context.Revert}
            </div>
        </div>
    );
}

function ChatAction(props: {
    text: string;
    icon: JSX.Element;
    onClick: () => void;
}) {
    const iconRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState({
        full: 16,
        icon: 16,
    });

    function updateWidth() {
        if (!iconRef.current || !textRef.current) return;
        const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
        const textWidth = getWidth(textRef.current);
        const iconWidth = getWidth(iconRef.current);
        setWidth({
            full: textWidth + iconWidth,
            icon: iconWidth,
        });
    }

    return (
        <div
            className={`${styles["chat-input-action"]} clickable`}
            onClick={() => {
                props.onClick();
                setTimeout(updateWidth, 1);
            }}
            onMouseEnter={updateWidth}
            onTouchStart={updateWidth}
            style={
                {
                    "--icon-width": `${width.icon}px`,
                    "--full-width": `${width.full}px`,
                } as React.CSSProperties
            }
        >
            <div ref={iconRef} className={styles["icon"]}>
                {props.icon}
            </div>
            <div className={styles["text"]} ref={textRef}>
                {props.text}
            </div>
        </div>
    );
}

function useScrollToBottom() {
    // for auto-scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    function scrollDomToBottom() {
        const dom = scrollRef.current;
        if (dom) {
            requestAnimationFrame(() => {
                setAutoScroll(true);
                dom.scrollTo(0, dom.scrollHeight);
            });
        }
    }

    // auto scroll
    useEffect(() => {
        if (autoScroll) {
            scrollDomToBottom();
        }
    });

    return {
        scrollRef,
        autoScroll,
        setAutoScroll,
        scrollDomToBottom,
    };
}

export function ChatActions(props: {
    showPromptModal: () => void;
    scrollToBottom: () => void;
    showPromptHints: () => void;
    hitBottom: boolean;
}) {
    const config = useAppConfig();
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore = query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());

    //是否未测试 从管理端跳转过来的
    const isTest = Boolean(query.get("isTest"));

    // switch themes
    const theme = config.theme;

    function nextTheme() {
        const themes = [Theme.Auto, Theme.Light, Theme.Dark];
        const themeIndex = themes.indexOf(theme);
        const nextIndex = (themeIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        config.update((config) => (config.theme = nextTheme));
    }

    // stop all responses
    const couldStop = ChatControllerPool.hasPending();
    const stopAll = () => ChatControllerPool.stopAll();

    // switch model
    const currentModel = chatStore.currentSession().mask.modelConfig.model;
    const models = useMemo(
        () =>
            config
                .allModels()
                .filter((m) => m.available)
                .map((m) => m.name),
        [config],
    );
    const [showModelSelector, setShowModelSelector] = useState(false);

    return (
        <div className={styles["chat-input-actions"]}>
            {/*{couldStop && (*/}
            {/*  <ChatAction*/}
            {/*    onClick={stopAll}*/}
            {/*    text={Locale.Chat.InputActions.Stop}*/}
            {/*    icon={<StopIcon />}*/}
            {/*  />*/}
            {/*)}*/}
            {!props.hitBottom && (
                <ChatAction
                    onClick={props.scrollToBottom}
                    text={Locale.Chat.InputActions.ToBottom}
                    icon={<BottomIcon/>}
                />
            )}


            <ChatAction
                onClick={nextTheme}
                text={Locale.Chat.InputActions.Theme[theme]}
                icon={
                    <>
                        {theme === Theme.Auto ? (
                            <AutoIcon/>
                        ) : theme === Theme.Light ? (
                            <LightIcon/>
                        ) : theme === Theme.Dark ? (
                            <DarkIcon/>
                        ) : null}
                    </>
                }
            />

            {/*<ChatAction*/}
            {/*  onClick={props.showPromptHints}*/}
            {/*  text={Locale.Chat.InputActions.Prompt}*/}
            {/*  icon={<PromptIcon />}*/}
            {/*/>*/}

            {/*<ChatAction*/}
            {/*  onClick={() => {*/}
            {/*    navigate(Path.Masks);*/}
            {/*  }}*/}
            {/*  text={Locale.Chat.InputActions.Masks}*/}
            {/*  icon={<MaskIcon />}*/}
            {/*/>*/}
            {/*清除聊天*/}
            {/*<ChatAction*/}
            {/*    text={Locale.Chat.InputActions.Clear}*/}
            {/*    icon={<BreakIcon/>}*/}
            {/*    onClick={() => {*/}
            {/*        chatStore.updateCurrentSession((session) => {*/}
            {/*            if (session.clearContextIndex === session.messages.length) {*/}
            {/*                session.clearContextIndex = undefined;*/}
            {/*            } else {*/}
            {/*                session.clearContextIndex = session.messages.length;*/}
            {/*                session.memoryPrompt = ""; // will clear memory*/}
            {/*            }*/}
            {/*        });*/}
            {/*    }}*/}
            {/*/>*/}
            {/*设置*/}
            {
                isTest && <ChatAction
                    onClick={() => {
                        navigate("/settings?isTest=1")
                    }}
                    text={Locale.Chat.InputActions.Settings}
                    icon={<SettingsIcon/>}
                />
            }
            {/*分享*/}
            {
                isTest && <ChatAction
                    onClick={() => {
                        navigate("/share?isTest=1")
                    }}
                    text={"分享链接"}
                    icon={<Share/>}
                />
            }

            {/*<ChatAction*/}
            {/*  onClick={() => setShowModelSelector(true)}*/}
            {/*  text={currentModel}*/}
            {/*  icon={<RobotIcon />}*/}
            {/*/>*/}

            {showModelSelector && (
                <Selector
                    defaultSelectedValue={currentModel}
                    items={models.map((m) => ({
                        title: m,
                        value: m,
                    }))}
                    onClose={() => setShowModelSelector(false)}
                    onSelection={(s) => {
                        if (s.length === 0) return;
                        chatStore.updateCurrentSession((session) => {
                            session.mask.modelConfig.model = s[0] as ModelType;
                            session.mask.syncGlobalConfig = false;
                        });
                        showToast(s[0]);
                    }}
                />
            )}
        </div>
    );
}

export function EditMessageModal(props: { onClose: () => void }) {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore = query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());
    const session = chatStore.currentSession();
    const [messages, setMessages] = useState(session.messages.slice());

    return (
        <div className="modal-mask">
            <Modal
                title={Locale.Chat.EditMessage.Title}
                onClose={props.onClose}
                actions={[
                    <IconButton
                        text={Locale.UI.Cancel}
                        icon={<CancelIcon/>}
                        key="cancel"
                        onClick={() => {
                            props.onClose();
                        }}
                    />,
                    <IconButton
                        type="primary"
                        text={Locale.UI.Confirm}
                        icon={<ConfirmIcon/>}
                        key="ok"
                        onClick={() => {
                            chatStore.updateCurrentSession(
                                (session) => (session.messages = messages),
                            );
                            props.onClose();
                        }}
                    />,
                ]}
            >
                <List>
                    <ListItem
                        title={Locale.Chat.EditMessage.Topic.Title}
                        subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
                    >
                        <input
                            type="text"
                            value={session.topic}
                            onInput={(e) =>
                                chatStore.updateCurrentSession(
                                    (session) => (session.topic = e.currentTarget.value),
                                )
                            }
                        ></input>
                    </ListItem>
                </List>
                {/*<ContextPrompts*/}
                {/*  context={messages}*/}
                {/*  updateContext={(updater) => {*/}
                {/*    const newMessages = messages.slice();*/}
                {/*    updater(newMessages);*/}
                {/*    setMessages(newMessages);*/}
                {/*  }}*/}
                {/*/>*/}
            </Modal>
        </div>
    );
}

function _Chat() {
    type RenderMessage = ChatMessage & { preview?: boolean };
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore = query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());
    const session = chatStore.currentSession();
    const config = useAppConfig();
    const fontSize = config.fontSize;

    const [showExport, setShowExport] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [userInput, setUserInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const {submitKey, shouldSubmit} = useSubmitHandler();
    const {scrollRef, setAutoScroll, scrollDomToBottom} = useScrollToBottom();
    const [hitBottom, setHitBottom] = useState(true);
    const isMobileScreen = useMobileScreen();
    const navigate = useNavigate();

    // prompt hints
    const promptStore = usePromptStore();
    const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
    const onSearch = useDebouncedCallback(
        (text: string) => {
            const matchedPrompts = promptStore.search(text);
            setPromptHints(matchedPrompts);
        },
        100,
        {leading: true, trailing: true},
    );

    // auto grow input
    const [inputRows, setInputRows] = useState(2);
    const measure = useDebouncedCallback(
        () => {
            const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
            const inputRows = Math.min(
                20,
                Math.max(2 + Number(!isMobileScreen), rows),
            );
            setInputRows(inputRows);
        },
        100,
        {
            leading: true,
            trailing: true,
        },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(measure, [userInput]);

    // chat commands shortcuts
    const chatCommands = useChatCommand({
        new: () => chatStore.newSession(),
        newm: () => navigate(Path.NewChat),
        prev: () => chatStore.nextSession(-1),
        next: () => chatStore.nextSession(1),
        clear: () =>
            chatStore.updateCurrentSession(
                (session) => (session.clearContextIndex = session.messages.length),
            ),
        del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
    });

    // only search prompts when user input is short
    const SEARCH_TEXT_LIMIT = 30;
    const onInput = (text: string) => {
        setUserInput(text);
        const n = text.trim().length;

        // clear search results
        if (n === 0) {
            setPromptHints([]);
        }
        // else if (text.startsWith(ChatCommandPrefix)) {
        //     setPromptHints(chatCommands.search(text));
        // } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
        //     // check if need to trigger auto completion
        //     // if (text.startsWith("/")) {
        //     //     let searchText = text.slice(1);
        //     //     onSearch(searchText);
        //     // }
        // }
    };

    const doSubmit = (userInput: string) => {
        if (userInput.trim() === "") return;
        const matchCommand = chatCommands.match(userInput);
        if (matchCommand.matched) {
            setUserInput("");
            setPromptHints([]);
            matchCommand.invoke();
            return;
        }
        setIsLoading(true);
        chatStore.onUserInput(userInput).then(() => setIsLoading(false));
        localStorage.setItem(LAST_INPUT_KEY, userInput);
        setUserInput("");
        setPromptHints([]);
        if (!isMobileScreen) inputRef.current?.focus();
        setAutoScroll(true);
    };

    const onPromptSelect = (prompt: RenderPompt) => {
        setTimeout(() => {
            setPromptHints([]);

            const matchedChatCommand = chatCommands.match(prompt.content);
            if (matchedChatCommand.matched) {
                // if user is selecting a chat command, just trigger it
                matchedChatCommand.invoke();
                setUserInput("");
            } else {
                // or fill the prompt
                setUserInput(prompt.content);
            }
            inputRef.current?.focus();
        }, 30);
    };

    // stop response
    const onUserStop = (messageId: string) => {
        ChatControllerPool.stop(session.id, messageId);
    };

    useEffect(() => {
        chatStore.updateCurrentSession((session) => {
            const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
            session.messages.forEach((m) => {
                // check if should stop all stale messages
                if (m.isError || new Date(m.date).getTime() < stopTiming) {
                    if (m.streaming) {
                        m.streaming = false;
                    }

                    if (m.content.length === 0) {
                        m.isError = true;
                        m.content = prettyObject({
                            error: true,
                            message: "empty response",
                        });
                    }
                }
            });

            // auto sync mask config from global config
            if (session.mask.syncGlobalConfig) {
                console.log("[Mask] syncing from global, name = ", session.mask.name);
                session.mask.modelConfig = {...config.modelConfig};
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // check if should send message
    const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((config.submitKey == SubmitKey.Enter) && (e.keyCode == 13 && e.ctrlKey)) {
            setUserInput(userInput + "\n")
        }
        // if ArrowUp and no userInput, fill with last input
        if (
            e.key === "ArrowUp" &&
            userInput.length <= 0 &&
            !(e.metaKey || e.altKey || e.ctrlKey)
        ) {

            setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
            e.preventDefault();
            return;
        }
        if (shouldSubmit(e) && promptHints.length === 0) {
            doSubmit(userInput);
            e.preventDefault();
        }
    };
    const onRightClick = (e: any, message: ChatMessage) => {
        // copy to clipboard
        if (selectOrCopy(e.currentTarget, message.content)) {
            if (userInput.length === 0) {
                setUserInput(message.content);
            }

            e.preventDefault();
        }
    };

    const deleteMessage = (msgId?: string) => {
        chatStore.updateCurrentSession(
            (session) =>
                (session.messages = session.messages.filter((m) => m.id !== msgId)),
        );
    };

    const onDelete = (msgId: string) => {
        deleteMessage(msgId);
    };

    const onResend = (message: ChatMessage) => {
        // when it is resending a message
        // 1. for a user's message, find the next bot response
        // 2. for a bot's message, find the last user's input
        // 3. delete original user input and bot's message
        // 4. resend the user's input

        const resendingIndex = session.messages.findIndex(
            (m) => m.id === message.id,
        );

        if (resendingIndex <= 0 || resendingIndex >= session.messages.length) {
            console.error("[Chat] failed to find resending message", message);
            return;
        }

        let userMessage: ChatMessage | undefined;
        let botMessage: ChatMessage | undefined;

        if (message.role === "assistant") {
            // if it is resending a bot's message, find the user input for it
            botMessage = message;
            for (let i = resendingIndex; i >= 0; i -= 1) {
                if (session.messages[i].role === "user") {
                    userMessage = session.messages[i];
                    break;
                }
            }
        } else if (message.role === "user") {
            // if it is resending a user's input, find the bot's response
            userMessage = message;
            for (let i = resendingIndex; i < session.messages.length; i += 1) {
                if (session.messages[i].role === "assistant") {
                    botMessage = session.messages[i];
                    break;
                }
            }
        }

        if (userMessage === undefined) {
            console.error("[Chat] failed to resend", message);
            return;
        }

        // delete the original messages
        deleteMessage(userMessage.id);
        deleteMessage(botMessage?.id);

        // resend the message
        setIsLoading(true);
        chatStore.onUserInput(userMessage.content).then(() => setIsLoading(false));
        inputRef.current?.focus();
    };

    const onPinMessage = (message: ChatMessage) => {
        chatStore.updateCurrentSession((session) =>
            session.mask.context.push(message),
        );

        showToast(Locale.Chat.Actions.PinToastContent, {
            text: Locale.Chat.Actions.PinToastAction,
            onClick: () => {
                setShowPromptModal(true);
            },
        });
    };

    const context: RenderMessage[] = useMemo(() => {
        return session.mask.hideContext ? [] : session.mask.context.slice();
    }, [session.mask.context, session.mask.hideContext]);
    const accessStore = useAccessStore();

    if (
        context.length === 0 &&
        session.messages.at(0)?.content !== BOT_HELLO.content
    ) {
        const copiedHello = Object.assign({}, BOT_HELLO);
        if (!accessStore.isAuthorized()) {
            // copiedHello.content = Locale.Error.Unauthorized;
        }
        context.push(copiedHello);
    }

    // preview messages
    const renderMessages = useMemo(() => {
        return context
            .concat(session.messages as RenderMessage[])
            .concat(
                isLoading
                    ? [
                        {
                            ...createMessage({
                                role: "assistant",
                                content: "……",
                            }),
                            preview: true,
                        },
                    ]
                    : [],
            )
            .concat(
                userInput.length > 0 && config.sendPreviewBubble
                    ? [
                        {
                            ...createMessage({
                                role: "user",
                                content: userInput,
                            }),
                            preview: true,
                        },
                    ]
                    : [],
            );
    }, [
        config.sendPreviewBubble,
        context,
        isLoading,
        session.messages,
        userInput,
    ]);

    const [msgRenderIndex, _setMsgRenderIndex] = useState(
        Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
    );

    function setMsgRenderIndex(newIndex: number) {
        newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
        newIndex = Math.max(0, newIndex);
        _setMsgRenderIndex(newIndex);
    }

    const messages = useMemo(() => {
        const endRenderIndex = Math.min(
            msgRenderIndex + 3 * CHAT_PAGE_SIZE,
            renderMessages.length,
        );
        return renderMessages.slice(msgRenderIndex, endRenderIndex);
    }, [msgRenderIndex, renderMessages]);

    const onChatBodyScroll = (e: HTMLElement) => {
        const bottomHeight = e.scrollTop + e.clientHeight;
        const edgeThreshold = e.clientHeight;

        const isTouchTopEdge = e.scrollTop <= edgeThreshold;
        const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
        const isHitBottom = bottomHeight >= e.scrollHeight - 10;

        const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
        const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

        if (isTouchTopEdge && !isTouchBottomEdge) {
            setMsgRenderIndex(prevPageMsgIndex);
        } else if (isTouchBottomEdge) {
            setMsgRenderIndex(nextPageMsgIndex);
        }

        setHitBottom(isHitBottom);
        setAutoScroll(isHitBottom);
    };

    function scrollToBottom() {
        setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
        scrollDomToBottom();
    }

    // clear context index = context length + index in messages
    const clearContextIndex =
        (session.clearContextIndex ?? -1) >= 0
            ? session.clearContextIndex! + context.length - msgRenderIndex
            : -1;

    const [showPromptModal, setShowPromptModal] = useState(false);

    const clientConfig = useMemo(() => getClientConfig(), []);

    const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
    const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;
    const [userAvatar, setUserAvatar] = useState("https://img.zcool.cn/community/01dc1b58ae3d6ca801219c77314f09.png@1280w_1l_2o_100sh.png");
    const [employeeAvatar, setEmployeeAvatar] = useState("")
    useEffect(() => {
        getUserInfo()
        // 关闭标题自动生成
        useAppConfig.getState().enableAutoGenerateTitle = false
        // console.log(baseConfig.baseURL)
    }, []);

    const _headers = {
        "Chat-Auth": window.localStorage.getItem("token"),
    };

    const getUserInfo = () => {
        const isLogin = window.localStorage.getItem("token");
        if (isLogin) {
            axios({
                url: baseConfig.baseURL + "/de/chat/showUserAvatar",
                method: "post",
                headers: _headers,
                responseType: 'arraybuffer'
            }).then(response => new Buffer(response.data, 'binary').toString('base64'))
                .then(data => {
                    console.log("图片:", data);
                    setUserAvatar("data:image/jpeg;base64," + data);
                }).catch(err =>{
                console.log("err-->",err)
            });
        }
    }
    // 查询单个模板
    const getTemplateQuery = (templateId: string) => {

    }
    // 从路由中获取数字人id和templateId
    // 获取url参数
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        // 获取id
        const id = query.get("id");
        const token = query.get("header");
        // 获取templateId
        const templateId = query.get("templateId");
        console.log("在客户端url获取到的信息", id, token, templateId)
        //   写入缓存中
        if (id) window.localStorage.setItem("employeeId", id as string);
        if (templateId) window.localStorage.setItem("templateId", templateId as string);
        if (token) window.localStorage.setItem("header", token as string);

        console.log("chatStore-->",query.get("id")||localStorage.getItem("employeeId"))
        console.log(chatStore)
        // chatStore.selectSession(1)
//   获取数字员工名称
        axios({
            url: baseConfig.baseURL + `/de/digitalEmployee/${window.localStorage.getItem("employeeId")}`,
            // url:"http://127.0.0.1:8080"+`/de/digitalEmployee/${id}`,
            method: "get",
            headers: {
                "Authorization": "Bearer " + window.localStorage.getItem("header"),
            }
        }).then((res) => {
            if (res.data.code == 200) {
                axios({
                    url: baseConfig.baseURL + `/de/employeeTemplate/${res.data.data.templateId}`,
                    headers: {
                        "Authorization": "Bearer " + window.localStorage.getItem("header"),
                    }
                }).then((tempRes) => {
                    if (res.data.data.avatar != null && res.data.data.avatar != "") {
                        setEmployeeAvatar("data:image/png;base64," + res.data.data.avatar);
                    } else {
                        setEmployeeAvatar("data:image/png;base64," + tempRes.data.data.avatar);
                    }
                    // session.topic = res.data.data.name + " " + tempRes.data.data.name;
                    res.data.data.name =res.data.data.name+" "+tempRes.data.data.name;
                    let f=false;
                    for (let i=0;i<chatStore.sessions.length;i++){
                        if (chatStore.sessions[i].mask.id==res.data.data.id){
                            chatStore.selectSession(i);
                            session.topic=res.data.data.name;
                            f=true
                            break;
                        }
                    }
                    if (!f&&query.get("id")){
                        chatStore.newSession(res.data.data)
                    }else {
                        // session.topic = res.data.data.name
                    }
                    console.log("sessions",chatStore.sessions)

                })
            }
        })
        // //     获取聊天记录
        // axios({
        //     url:"http://192.168.1.49:8061/chat-server/chat-server/nsai/filter/chat-history.do",
        //     method:"post",
        //     headers:{
        //         "Chat-Auth":localStorage.getItem("token")
        //     }
        // }).then(res=>{
        //     console.log("history",res.data)
        //     // chatStore.clearSessions()
        //     // chatStore.newSession(res.data)
        //     setTimeout(() => {
        //         // localStorage.setItem("chat-next-web-store",JSON.stringify(res.data))
        //         console.log("改完了")
        //         // chatStore.sessions=res.data.state.sessions
        //         chatStore.setSessions(res.data.state.sessions)
        //     },1000)
        //
        // })
    }, []);


    useCommand({
        fill: setUserInput,
        submit: (text) => {
            doSubmit(text);
        },
        code: (text) => {
            console.log("[Command] got code from url: ", text);
            showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
                if (res) {
                    accessStore.updateCode(text);
                }
            });
        },
        settings: (text) => {
            try {
                const payload = JSON.parse(text) as {
                    key?: string;
                    url?: string;
                };

                console.log("[Command] got settings from url: ", payload);

                if (payload.key || payload.url) {
                    showConfirm(
                        Locale.URLCommand.Settings +
                        `\n${JSON.stringify(payload, null, 4)}`,
                    ).then((res) => {
                        if (!res) return;
                        if (payload.key) {
                            accessStore.updateToken(payload.key);
                        }
                        if (payload.url) {
                            accessStore.updateOpenAiUrl(payload.url);
                        }
                    });
                }
            } catch {
                console.error("[Command] failed to get settings from url: ", text);
            }
        },
    });

    // edit / insert message modal
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const destruction=()=>{
        window.parent.postMessage("close", baseConfig.closeUrl);
    }
    return (
        <div className={styles.chat} key={session.id}>
            <div className="window-header" data-tauri-drag-region>
                {isMobileScreen && (
                    <div className="window-actions">
                        {
                            !query.get("isVisitor") && <div className={"window-action-button"}>
                                <IconButton
                                    icon={<ReturnIcon/>}
                                    bordered
                                    title={Locale.Chat.Actions.ChatList}
                                    onClick={() => navigate(Path.Home)}
                                />
                            </div>
                        }
                    </div>
                )}

                <div className={`window-header-title ${styles["chat-body-title"]}`}>
                    <div
                        title={!session.topic ? DEFAULT_TOPIC : session.topic}
                        className={`window-header-main-title ${styles["chat-body-main-title"]}`}
                        style={{width: "15em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}
                    >
                        {!session.topic ? DEFAULT_TOPIC : session.topic}
                    </div>
                    <div className="window-header-sub-title">
                        {Locale.Chat.SubTitle(session.messages.length)}
                    </div>
                </div>
                <div className="window-actions">
                    {/*{!isMobileScreen && (*/}
                    {/*  <div className="window-action-button">*/}
                    {/*    <IconButton*/}
                    {/*      icon={<RenameIcon />}*/}
                    {/*      bordered*/}
                    {/*      onClick={() => setIsEditingMessage(true)}*/}
                    {/*    />*/}
                    {/*  </div>*/}
                    {/*)}*/}
                    {/*<div className="window-action-button">*/}
                    {/*  <IconButton*/}
                    {/*    icon={<ExportIcon />}*/}
                    {/*    bordered*/}
                    {/*    title={Locale.Chat.Actions.Export}*/}
                    {/*    onClick={() => {*/}
                    {/*      setShowExport(true);*/}
                    {/*    }}*/}
                    {/*  />*/}
                    {/*</div>*/}
                    {showMaxIcon && (
                        <div className="window-action-button">
                            <IconButton
                                icon={config.tightBorder ? <MinIcon/> : <MaxIcon/>}
                                bordered
                                onClick={() => {
                                    config.update(
                                        (config) => (config.tightBorder = !config.tightBorder),
                                    );
                                }}
                            />
                        </div>
                    )}
                    {
                        query.get("isTest")&&<div className="window-actions">
                            <div className="window-action-button"></div>
                            <div className="window-action-button"></div>
                            <div className="window-action-button">
                                <IconButton
                                    icon={<CloseIcon/>}
                                    onClick={() => destruction()}
                                    bordered
                                />
                            </div>
                        </div>
                    }
                </div>

                <PromptToast
                    showToast={!hitBottom}
                    showModal={showPromptModal}
                    setShowModal={setShowPromptModal}
                />
            </div>

            <div
                className={styles["chat-body"]}
                ref={scrollRef}
                onScroll={(e) => onChatBodyScroll(e.currentTarget)}
                onMouseDown={() => inputRef.current?.blur()}
                onTouchStart={() => {
                    inputRef.current?.blur();
                    setAutoScroll(false);
                }}
            >
                {messages.map((message, i) => {
                    const isUser = message.role === "user";
                    const isContext = i < context.length;
                    const showActions =
                        i > 0 &&
                        !(message.preview || message.content.length === 0) &&
                        !isContext;
                    const showTyping = message.preview || message.streaming;

                    const shouldShowClearContextDivider = i === clearContextIndex - 1;
                    return (
                        <Fragment key={message.id}>
                            <div
                                className={
                                    isUser ? styles["chat-message-user"] : styles["chat-message"]
                                }
                            >
                                <div className={styles["chat-message-container"]}>
                                    <div className={styles["chat-message-header"]}>
                                        <div className={styles["chat-message-avatar"]}>
                                            <div className={styles["chat-message-edit"]}>
                                                {/*<IconButton*/}
                                                {/*  icon={<EditIcon />}*/}
                                                {/*  onClick={async () => {*/}
                                                {/*    const newMessage = await showPrompt(*/}
                                                {/*      Locale.Chat.Actions.Edit,*/}
                                                {/*      message.content,*/}
                                                {/*      10,*/}
                                                {/*    );*/}
                                                {/*    chatStore.updateCurrentSession((session) => {*/}
                                                {/*      const m = session.mask.context*/}
                                                {/*        .concat(session.messages)*/}
                                                {/*        .find((m) => m.id === message.id);*/}
                                                {/*      if (m) {*/}
                                                {/*        m.content = newMessage;*/}
                                                {/*      }*/}
                                                {/*    });*/}
                                                {/*  }}*/}
                                                {/*></IconButton>*/}
                                            </div>
                                            {isUser ? (
                                                <img src={userAvatar} alt="" width={40} height={40}
                                                     style={{borderRadius: "20px"}}/>
                                            ) : (
                                                employeeAvatar ? <img
                                                        src={employeeAvatar}
                                                        alt="" width={40} height={40} style={{borderRadius: "20px"}}/> :
                                                    // <Avatar model={"gpt-3.5-turbo"}/>
                                                    <img src={baseEmployeeAvatar.src} width={40} height={40} style={{borderRadius: "20px"}}/>
                                            )}
                                        </div>

                                        {showActions && (
                                            <div className={styles["chat-message-actions"]}>
                                                {/*<div className={styles["chat-input-actions"]}>*/}
                                                {/*  {message.streaming ? (*/}
                                                {/*    <ChatAction*/}
                                                {/*      text={Locale.Chat.Actions.Stop}*/}
                                                {/*      icon={<StopIcon />}*/}
                                                {/*      onClick={() => onUserStop(message.id ?? i)}*/}
                                                {/*    />*/}
                                                {/*  ) : (*/}
                                                {/*    <>*/}
                                                {/*      <ChatAction*/}
                                                {/*        text={Locale.Chat.Actions.Retry}*/}
                                                {/*        icon={<ResetIcon />}*/}
                                                {/*        onClick={() => onResend(message)}*/}
                                                {/*      />*/}

                                                {/*      <ChatAction*/}
                                                {/*        text={Locale.Chat.Actions.Delete}*/}
                                                {/*        icon={<DeleteIcon />}*/}
                                                {/*        onClick={() => onDelete(message.id ?? i)}*/}
                                                {/*      />*/}

                                                {/*      <ChatAction*/}
                                                {/*        text={Locale.Chat.Actions.Pin}*/}
                                                {/*        icon={<PinIcon />}*/}
                                                {/*        onClick={() => onPinMessage(message)}*/}
                                                {/*      />*/}
                                                {/*      <ChatAction*/}
                                                {/*        text={Locale.Chat.Actions.Copy}*/}
                                                {/*        icon={<CopyIcon />}*/}
                                                {/*        onClick={() => copyToClipboard(message.content)}*/}
                                                {/*      />*/}
                                                {/*    </>*/}
                                                {/*  )}*/}
                                                {/*</div>*/}
                                            </div>
                                        )}
                                    </div>
                                    {showTyping && (
                                        <div className={styles["chat-message-status"]}>
                                            {Locale.Chat.Typing}
                                        </div>
                                    )}
                                    <div className={styles["chat-message-item"]}>
                                        <Markdown
                                            content={message.content}
                                            loading={
                                                (message.preview || message.streaming) &&
                                                message.content.length === 0 &&
                                                !isUser
                                            }
                                            onContextMenu={(e) => onRightClick(e, message)}
                                            onDoubleClickCapture={() => {
                                                if (!isMobileScreen) return;
                                                setUserInput(message.content);
                                            }}
                                            fontSize={fontSize}
                                            parentRef={scrollRef}
                                            defaultShow={i >= messages.length - 6}
                                        />
                                    </div>

                                    <div className={styles["chat-message-action-date"]}>
                                        {isContext
                                            ? Locale.Chat.IsContext
                                            : message.date.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            {shouldShowClearContextDivider && <ClearContextDivider/>}
                        </Fragment>
                    );
                })}
            </div>

            <div className={styles["chat-input-panel"]}>
                <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect}/>

                <ChatActions
                    showPromptModal={() => setShowPromptModal(true)}
                    scrollToBottom={scrollToBottom}
                    hitBottom={hitBottom}
                    showPromptHints={() => {
                        // Click again to close
                        if (promptHints.length > 0) {
                            setPromptHints([]);
                            return;
                        }

                        inputRef.current?.focus();
                        setUserInput("/");
                        onSearch("");
                    }}
                />
                <div className={styles["chat-input-panel-inner"]}>
          <textarea
              ref={inputRef}
              className={styles["chat-input"]}
              placeholder={Locale.Chat.Input(submitKey)}
              onInput={(e) => onInput(e.currentTarget.value)}
              value={userInput}
              onKeyDown={onInputKeyDown}
              onFocus={scrollToBottom}
              onClick={scrollToBottom}
              rows={inputRows}
              autoFocus={autoFocus}
              style={{
                  fontSize: config.fontSize,
              }}
          />
                    <IconButton
                        icon={<SendWhiteIcon/>}
                        text={Locale.Chat.Send}
                        className={styles["chat-input-send"]}
                        type="primary"
                        onClick={() => doSubmit(userInput)}
                    />
                </div>
            </div>

            {showExport && (
                <ExportMessageModal onClose={() => setShowExport(false)}/>
            )}

            {isEditingMessage && (
                <EditMessageModal
                    onClose={() => {
                        setIsEditingMessage(false);
                    }}
                />
            )}
        </div>
    );
}

export function Chat() {
    // const [isLogin,setIsLogin]=useState(window.localStorage.getItem("token"));
    // const navigate = useNavigate();
    // useEffect(()=>{
    //   if (!isLogin){
    //     console.log("111")
    //     navigate("/login");
    //   }
    // },[])
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // console.log("ssss",query.get("isTest"))
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chatStore =query.get("isTest")?useChatStoreTest():(query.get("isVisitor")?useChatStoreVisitor():useChatStore());
    const sessionIndex = chatStore.currentSessionIndex;
    return <_Chat key={sessionIndex}></_Chat>;
}
