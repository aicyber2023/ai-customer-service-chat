import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import baseConfig from "../../public/url";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Popover,
  Select,
  showConfirm,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import { copyToClipboard } from "../utils";
import Link from "next/link";
import { Path, RELEASE_URL, UPDATE_URL } from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";
import { nanoid } from "nanoid";
import axios from "axios";

function UpdatePassword(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;
  const [editingPromptId, setEditingPromptId] = useState<string>();
  const [oledPassword, setOledPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isHT, setIsHT] = useState(true);
  const [zhinengItem, setZhinengItem] = useState([
    "通用",
    "导游",
    "客服",
    "行政人员",
    "法律顾问",
    "合同审查员",
  ]);
  const _headers = {
    "Chat-Auth": window.localStorage.getItem("token"),
  };
  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);
  const ConfirmUpdatePassword = () => {
    if (newPassword1 != newPassword2) {
      window.alert("两次密码不匹配");
      return;
    }
    axios({
      url:
        baseConfig.baseURL +
        `/de/chat/updateUserPwd?oldPassword=${oledPassword}&newPassword=${newPassword1}`,
      headers: _headers,
    }).then((res) => {
      if (res.data.code != 200) {
        window.alert(res.data.msg);
      } else if (res.data.code == 200) {
        window.alert("密码修改成功");
        props.onClose?.();
      }
    });
  };
  return (
    <div className="modal-mask">
      <Modal title={"修改密码"} onClose={() => props.onClose?.()}>
        <div className={styles["user-prompt-modal"]}>
          <div className={styles["update-modal"]}>
            <input
              type={"password"}
              value={oledPassword}
              onChange={(e) => {
                setOledPassword(e.target.value);
              }}
              placeholder={"请输入旧密码"}
            />
            <input
              type={"password"}
              value={newPassword1}
              onChange={(e) => {
                setNewPassword1(e.target.value);
              }}
              placeholder={"请输入新密码"}
            />
            <input
              type={"password"}
              value={newPassword2}
              onChange={(e) => {
                setNewPassword2(e.target.value);
              }}
              placeholder={"再次输入新密码"}
            />
            <input
              type={"button"}
              value={"确认修改"}
              onClick={ConfirmUpdatePassword}
            />
          </div>
        </div>
      </Modal>

      {/*{editingPromptId !== undefined && (*/}
      {/*    <EditPromptModal*/}
      {/*        id={editingPromptId!}*/}
      {/*        onClose={() => setEditingPromptId(undefined)}*/}
      {/*    />*/}
      {/*)}*/}
    </div>
  );
}

function SyncItems() {
  const syncStore = useSyncStore();
  const webdav = syncStore.webDavConfig;

  // not ready: https://github.com/Yidadaa/AoTu-Next-Web/issues/920#issuecomment-1609866332
  return null;

  return (
    <List>
      <ListItem
        title={"上次同步：" + new Date().toLocaleString()}
        subTitle={"20 次对话，100 条消息，200 提示词，20 面具"}
      >
        <IconButton
          icon={<ResetIcon />}
          text="同步"
          onClick={() => {
            syncStore.check().then();
          }}
        />
      </ListItem>

      <ListItem
        title={"本地备份"}
        subTitle={"20 次对话，100 条消息，200 提示词，20 面具"}
      ></ListItem>

      <ListItem
        title={"Web Dav Server"}
        subTitle={Locale.Settings.AccessCode.SubTitle}
      >
        <input
          value={webdav.server}
          type="text"
          placeholder={"https://example.com"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.server = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem title="Web Dav User Name" subTitle="user name here">
        <input
          value={webdav.username}
          type="text"
          placeholder={"username"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.username = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem title="Web Dav Password" subTitle="password here">
        <input
          value={webdav.password}
          type="text"
          placeholder={"password"}
          onChange={(e) => {
            syncStore.update(
              (config) => (config.password = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </List>
  );
}

export function UserSettings() {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const config = useAppConfig();
  const updateConfig = config.update;

  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentVersion = updateStore.formatVersion(updateStore.version);
  const remoteId = updateStore.formatVersion(updateStore.remoteVersion);
  const hasNewVersion = currentVersion !== remoteId;
  const updateUrl = getClientConfig()?.isApp ? RELEASE_URL : UPDATE_URL;

  // 是否为登录
  const isAuth = window.localStorage.getItem("token");

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestVersion(force).then(() => {
      setCheckingUpdate(false);
    });

    //console.log("[Update] local version ", updateStore.version);
    //console.log("[Update] remote version ", updateStore.remoteVersion);
  }

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);

  function checkUsage(force = false) {
    if (accessStore.hideBalanceQuery) {
      return;
    }

    setLoadingUsage(true);
    updateStore.updateUsage(force).finally(() => {
      setLoadingUsage(false);
    });
  }

  const accessStore = useAccessStore();
  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [ShowUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);

  const showUsage = accessStore.isAuthorized();
  useEffect(() => {
    // checks per minutes
    checkUpdate();
    showUsage && checkUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientConfig = useMemo(() => getClientConfig(), []);
  const showAccessCode = enabledAccessControl && !clientConfig?.isApp;

  const [userInfo, setUserInfo] = useState({
    nickName: "",
  });
  const [userAvatar, setUserAvatar] = useState("");
  const _headers = {
    "Chat-Auth": window.localStorage.getItem("token"),
  };
  //客服模板列表

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = () => {
    axios({
      url: baseConfig.baseURL + "/de/chat/getUserInfo",
      method: "post",
      headers: _headers,
    })
      .then((res) => {
        //console.log("nickName:", res);
        setUserInfo(res.data.data);
        return axios({
          url: baseConfig.baseURL + "/de/chat/showUserAvatar",
          method: "post",
          headers: _headers,
          responseType: "arraybuffer",
        });
      })
      .then((response) =>
        new Buffer(response.data, "binary").toString("base64"),
      )
      .then((data) => {
        //console.log("图片:", data);
        setUserAvatar("data:image/jpeg;base64," + data);
      })
      .catch((err) => {
        setUserAvatar(
          "https://img.zcool.cn/community/01dc1b58ae3d6ca801219c77314f09.png@1280w_1l_2o_100sh.png",
        );
        //console.log("err-->",err)
      });
  };

  const UploadAvatar = () => {
    const _headers = {
      "Chat-Auth": window.localStorage.getItem("token"),
    };
    // @ts-ignore
    const file = document.getElementById("picture").files[0];
    //console.log("file", file);
    var formdata = new FormData();
    formdata.append("file", file);
    axios({
      url: baseConfig.baseURL + "/de/chat/uploadUserAvatar",
      method: "post",
      headers: _headers,
      data: formdata,
    }).then((res) => {
      //console.log("返回结果", res);
      getUserInfo();
    });
  };

  const updateNickName = ({ e }: { e: any }) => {
    // @ts-ignore
    const obj = { ...userInfo };
    obj.nickName = e.target.value;
    setUserInfo(obj);
  };

  const uploadUserInfo = () => {
    axios({
      url: baseConfig.baseURL + "/de/chat/modifyUser",
      method: "post",
      headers: _headers,
      data: userInfo,
    }).then((res) => {
      if (res.data.code == 200) {
        getUserInfo();
      }
    });
  };

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.Settings.Title}
          </div>
          <div className="window-header-sub-title">
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button"></div>
          <div className="window-action-button"></div>
          <div className="window-action-button">
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <h3 style={{ marginLeft: "10px" }}>基本设置</h3>
        <List>
          {/*  头像  */}
          <ListItem
            title={Locale.Settings.Avatar}
            subTitle={"头像图片上传大小在1M以内"}
          >
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.avatar = avatar));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div className={styles.avatar}>
                {/*<Avatar avatar={config.avatar}/>*/}
                <img
                  src={userAvatar}
                  width={50}
                  height={50}
                  onClick={() => {
                    document.getElementById("picture")?.click();
                  }}
                  style={{ borderRadius: "25px" }}
                />
                <input
                  className="file-upload"
                  type="file"
                  accept="image/*"
                  name="picture"
                  id="picture"
                  style={{ display: "none" }}
                  onChange={UploadAvatar}
                />
              </div>
            </Popover>
          </ListItem>

          {/*  名称  */}
          <ListItem title={"用户名"}>
            <input
              type="text"
              value={userInfo.nickName}
              onBlur={uploadUserInfo}
              maxLength={10}
              onChange={(e) => {
                updateNickName({ e: e });
              }}
              disabled={true}
              style={{ cursor: "not-allowed" }}
            />
          </ListItem>

          <ListItem title={"修改密码"}>
            <IconButton
              icon={<EditIcon />}
              text={"修改"}
              onClick={() => setShowUpdatePasswordModal(true)}
            />
          </ListItem>

          <ListItem title={Locale.Settings.SendKey}>
            <Select
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title={Locale.Settings.Theme}>
            <Select
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem
            title={Locale.Settings.FontSize.Title}
            subTitle={Locale.Settings.FontSize.SubTitle}
          >
            <InputRange
              title={`${config.fontSize ?? 14}px`}
              value={config.fontSize}
              min="12"
              max="18"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.fontSize = Number.parseInt(e.currentTarget.value)),
                )
              }
            ></InputRange>
          </ListItem>

          {/*<ListItem*/}
          {/*    title={Locale.Settings.AutoGenerateTitle.Title}*/}
          {/*    subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}*/}
          {/*>*/}
          {/*    <input*/}
          {/*        type="checkbox"*/}
          {/*        checked={config.enableAutoGenerateTitle}*/}
          {/*        onChange={(e) =>*/}
          {/*            updateConfig(*/}
          {/*                (config) =>*/}
          {/*                    (config.enableAutoGenerateTitle = e.currentTarget.checked),*/}
          {/*            )*/}
          {/*        }*/}
          {/*    ></input>*/}
          {/*</ListItem>*/}

          {/*<ListItem*/}
          {/*    title={Locale.Settings.SendPreviewBubble.Title}*/}
          {/*    subTitle={Locale.Settings.SendPreviewBubble.SubTitle}*/}
          {/*>*/}
          {/*    <input*/}
          {/*        type="checkbox"*/}
          {/*        checked={config.sendPreviewBubble}*/}
          {/*        onChange={(e) =>*/}
          {/*            updateConfig(*/}
          {/*                (config) =>*/}
          {/*                    (config.sendPreviewBubble = e.currentTarget.checked),*/}
          {/*            )*/}
          {/*        }*/}
          {/*    ></input>*/}
          {/*</ListItem>*/}
        </List>

        <SyncItems />

        {ShowUpdatePasswordModal && (
          <UpdatePassword onClose={() => setShowUpdatePasswordModal(false)} />
        )}

        {/*<DangerItems />*/}
      </div>
    </ErrorBoundary>
  );
}
