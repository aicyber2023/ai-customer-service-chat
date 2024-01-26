import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import SaveIcon from "../icons/copy.svg";
import baseConfig from "../../public/url";
import SubIcon from "../icons/sub.svg";
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
import ReturnIcon from "@/app/icons/return.svg";
import { rgb } from "khroma";
import { log } from "mermaid/dist/logger";
import { s } from "hastscript";

export function Settings() {
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

  const promptStore = usePromptStore();
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

  // 角色头像
  const [avatar, setAvatar] = useState("");
  // 客服名称
  const [employeeName, setEmployeeName] = useState("");
  //客服模板列表
  const [zhinengItem, setZhineng] = useState([
    {
      id: "",
      name: "",
    },
  ]);
  //选中的客服模板
  const [selectZhiNeng, setSelectZhiNeng] = useState("");
  //知识库列表
  const [nowledgeBase, setNowledgeBase] = useState([
    "无",
    "知识库一",
    "知识库二",
    "知识库三",
  ]);
  //选中的知识库
  const [selectNowledgeBase, setSelectNowledgeBase] = useState("无");
  //公司名称
  const [corporateName, setCorporateName] = useState("");
  // 公司LOGO
  const [logo, setLogo] = useState("");
  //说话风格
  const [speakingStyle, setSpeakingStyle] = useState([
    "亲切",
    "幽默",
    "活泼",
    "商务",
  ]);
  //选中的说话风格
  const [selectSpeakingStyle, setSelectSpeakingStyle] = useState("");
  // 是否主动打招呼
  const [sayHello, setSayHello] = useState(true);
  // 主动打招呼语
  const [sayHelloText, setSayHelloText] =
    useState("你好，有什么可以帮助你的吗？");
  const [greeting, setGreeting] = useState("");
  // 创造性
  const [creativeness, setCreativeness] = useState(5);
  // 干预相似问闽值
  const [interventionSimilarityThreshold, setInterventionSimilarityThreshold] =
    useState(0);
  // 是否展示引用
  const [showReferences, setShowReferences] = useState(true);
  // 是否展示问题引用
  const [showProblemRecommendations, setShowProblemRecommendations] =
    useState(true);
  // 是否主动推荐
  const [proactivelyRecommend, setProactivelyRecommend] = useState(true);
  // 回答丰富性
  const [richAnswers, setRichAnswers] = useState(true);
  // 兜底话术
  const [backdoorStorytelling, setBackdoorStorytelling] = useState(true);
  // 话术数组
  const [scriptArr, setScriptArr] = useState([
    {
      id: "1",
      content: "非常抱歉，我还没学到相关知识。",
      enable: 1,
      digitalEmployeeId: window.localStorage.getItem("employeeId"),
      templateId: window.localStorage.getItem("templateId"),
    },
  ]);

  // 随机性
  const [temperature, setTemperature] = useState(0.4);
  // 话题新鲜度
  const [presencePenalty, setPresencePenalty] = useState(1);
  //频率惩罚度
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.5);
  // 历史消息数
  const [historyMessageCount, setHistoryMessageCount] = useState(4);
  // 历史摘要
  const [sendMemory, setSendMemory] = useState(1);

  const query = new URLSearchParams(location.search);

  // 知识库模式
  const [chatType, setChatType] = useState(0);
  const [chatTypeList, setChatTypeList] = useState([
    {
      id: 0,
      type: "仅支持问答库",
    },
    {
      id: 1,
      type: "仅支持文档库",
    },
    {
      id: 2,
      type: "同时支持问答库和文档库",
    },
  ]);
  // 问题命中匹配度
  const [qaRadius, setQaRadius] = useState(0.5);
  //文本命中匹配度
  const [kbRadius, setKbRadius] = useState(0.5);
  //超纲问题回复
  const [modelSwitch, setModelSwitch] = useState(0);
  const [modelSwitchList, setModelSwitchList] = useState([
    {
      id: 0,
      type: "使用兜底话术",
    },
    {
      id: 1,
      type: "使用大模型知识",
    },
    {
      id: 2,
      type: "智能兜底",
    },
  ]);
  const [quantityOfInformation, setQuantityOfInformation] = useState(1);

  useEffect(() => {
    const id = window.localStorage.getItem("employeeId");
    const templateId = window.localStorage.getItem("templateId");
    const token = window.localStorage.getItem("header");
    //   获取数字客服详情信息
    getEmployeeInformation();
    // //     获取数字客服对应的模板信息
    // axios({
    //     url: `http://localhost/dev-api/de/employeeTemplate/${templateId}`,
    //     method: "get",
    //     headers: {
    //         "Authorization": token
    //     }
    // }).then((res) => {
    //     // @ts-ignore
    //     if (res.data.code == 200) {
    //         //console.log("模板获取成功", res)
    //
    //     }
    // })
    //     获取所有模板列表
    axios({
      // url: "http://localhost/dev-api/de/employeeTemplate/selectList",
      // @ts-ignore
      url: baseConfig.baseURL + "/de/employeeTemplate/selectList",
      method: "get",
      headers: {
        Authorization: token,
      },
    }).then((res) => {
      if (res.data.code == 200) {
        let arr = [];
        for (let item of res.data.data) {
          let obj = {
            id: item.id,
            name: item.name,
          };
          arr.push(obj);
        }
        // @ts-ignore
        setZhineng(arr);
      }
    });
  }, []);
  // 获取数字客服信息
  const getEmployeeInformation = () => {
    const id = window.localStorage.getItem("employeeId");
    const templateId = window.localStorage.getItem("templateId");
    const token = window.localStorage.getItem("header");
    axios({
      // url: `http://localhost/dev-api/de/digitalEmployee/${id}`,
      // @ts-ignore
      url: baseConfig.baseURL + `/de/digitalEmployee/${id}`,
      method: "get",
      headers: {
        Authorization: token,
      },
    }).then((res) => {
      // @ts-ignore
      if (res.data.code == 200) {
        //console.log("数字客服获取成功", res)
        setTemperature(res.data.data.temperature ?? 0.5);
        setPresencePenalty(res.data.data.presencePenalty ?? 0);
        setFrequencyPenalty(res.data.data.frequencyPenalty ?? 0);
        setHistoryMessageCount(res.data.data.historyMessageCount ?? 4);
        setSayHello(
          res.data.data.proactivelyGreet == 0 ||
            res.data.data.proactivelyGreet == null
            ? false
            : true,
        );
        setSendMemory(res.data.data.sendMemory);
        // 设置选中的模板id
        setSelectZhiNeng(res.data.data.templateId);
        // 设置数字客服名称
        setEmployeeName(res.data.data.name);
        if (res.data.data.procedureList.length > 0) {
          setScriptArr(res.data.data.procedureList);
        }
        setChatType(res.data.data.chatType);
        setQaRadius(res.data.data.qaRadius ?? 0.5);
        setKbRadius(res.data.data.kbRadius ?? 0.5);
        setModelSwitch(res.data.data.modelSwitch);
        setScriptArr(res.data.data.procedureList);
        setSayHello(res.data.data.proactivelyGreet == 0 ? false : true);
        setGreeting(res.data.data.greeting);
        setQuantityOfInformation(res.data.data.quantityOfInformation);
        axios({
          // url: `http://localhost/dev-api/de/employeeTemplate/${res.data.data.templateId}`,
          url:
            // @ts-ignore
            baseConfig.baseURL +
            `/de/employeeTemplate/${res.data.data.templateId}`,
          method: "get",
          headers: {
            Authorization: token,
          },
        }).then((templateRes) => {
          // @ts-ignore
          if (templateRes.data.code == 200) {
            !res.data.data.companyName
              ? setCorporateName(templateRes.data.data.companyName)
              : setCorporateName(res.data.data.companyName);
            !res.data.data.avatar
              ? setAvatar(templateRes.data.data.avatar)
              : setAvatar(res.data.data.avatar);
            !res.data.data.companyAvatar
              ? setLogo(templateRes.data.data.companyAvatar)
              : setLogo(res.data.data.companyAvatar);
          }
        });
      }
    });
  };

  // 获取角色信息
  const getInfo = () => {};
  // 修改角色头像上传
  const UploadAvatar = () => {
    // @ts-ignore
    const file = document.getElementById("picture").files[0];
    //console.log("file", file);
    const employeeId = window.localStorage.getItem("employeeId");
    var formdata = new FormData();
    formdata.append("file", file);
    formdata.append("employeeId", employeeId as string);
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/de/digitalEmployee/uploadAvatar",
      // url: "http://127.0.0.1:8080" + "/de/chat/uploadUserAvatar",
      method: "post",
      data: formdata,
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("header"),
      },
    }).then((res) => {
      //console.log("返回结果", res);
      getEmployeeInformation();
    });
  };
  // 修改公司logo
  const UploadLogo = () => {
    // @ts-ignore
    const logoFile = document.getElementById("logo").files[0];
    //console.log("logoFile", logoFile);
    const employeeId = window.localStorage.getItem("employeeId");
    var formdata = new FormData();
    formdata.append("file", logoFile);
    formdata.append("employeeId", employeeId as string);
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/de/digitalEmployee/uploadCompanyAvatar",
      method: "post",
      data: formdata,
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("header"),
      },
    }).then((res) => {
      //console.log("返回结果", res);
      getEmployeeInformation();
    });
  };

  // 保存设置
  const SaveSettings = () => {
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/de/digitalEmployee",
      // url:"http://127.0.0.1:8080"+"/de/digitalEmployee",
      method: "put",
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("header"),
      },
      data: {
        id: window.localStorage.getItem("employeeId"),
        name: employeeName,
        companyName: corporateName,
        templateId: selectZhiNeng,
        temperature: temperature,
        presencePenalty: presencePenalty,
        frequencyPenalty: frequencyPenalty,
        historyMessageCount: historyMessageCount,
        sendMemory: sendMemory,
        proactivelyGreet: sayHello ? 1 : 0,
        greeting: greeting,
        chatType: chatType,
        qaRadius: qaRadius,
        kbRadius: kbRadius,
        modelSwitch: modelSwitch,
        procedureList: scriptArr.map((item) => {
          item.id = "";
          return item;
        }),
        quantityOfInformation: quantityOfInformation,
      },
    }).then((res) => {
      if (res.data.code == 200) {
        // getEmployeeInformation()
        navigate(Path.Home + "?isTest=1");
      }
    });
  };

  // 更新兜底话术的值
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    id: String,
  ) => {
    const updatedScriptArr = scriptArr.map((item) => {
      if (item.id === id) {
        return { ...item, content: event.target.value };
      }
      return item;
    });

    setScriptArr(updatedScriptArr);
  };
  // 删除兜底话术的值
  const handleInputDelete = (id: String, index: number) => {
    if (scriptArr.length == 1) {
      return;
    }
    if (index == scriptArr.length - 1) {
      const updatedScriptArr = scriptArr.map((item) => {
        if (item.id == scriptArr[index - 1].id) {
          item.enable = 1;
        } else {
          item.enable = 0;
        }
        return item;
      });
      setScriptArr(updatedScriptArr);
    } else {
      const updatedScriptArr = scriptArr.map((item) => {
        if (item.id == scriptArr[index + 1].id) {
          item.enable = 1;
        } else {
          item.enable = 0;
        }
        return item;
      });
      setScriptArr(updatedScriptArr);
    }
    const updatedScriptArr = scriptArr.filter((item) => {
      return item.id !== id;
    });
    setScriptArr(updatedScriptArr);
  };
  // 添加兜底话术
  const handleInputAdd = () => {
    let f = false;
    const updatedScriptArr = scriptArr.map((item) => {
      if (item.enable == 1) {
        f = true;
      }
      return item;
    });
    updatedScriptArr.push({
      id: nanoid(),
      content: "",
      enable: f ? 0 : 1,
      digitalEmployeeId: window.localStorage.getItem("employeeId"),
      templateId: window.localStorage.getItem("templateId"),
    });
    setScriptArr(updatedScriptArr);
  };
  // 切换选中的 兜底话术
  const handleUpdatEnable = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: String,
  ) => {
    const updatedScriptArr = scriptArr.map((item) => {
      if (item.id == id) {
        item.enable = 1;
      } else {
        item.enable = 0;
      }
      return item;
    });
    setScriptArr(updatedScriptArr);
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
              onClick={() => navigate(Path.Home + "?isTest=1")}
              bordered
            />
          </div>
        </div>
      </div>

      <div className={styles["settings"]}>
        <h3 style={{ paddingLeft: "10px" }}>客服设置</h3>
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
                  src={"data:image/jpeg;base64," + avatar}
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
          {/*客服昵称*/}
          <ListItem title={"客服昵称"}>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value);
              }}
              maxLength={10}
            />
          </ListItem>
          {/*客服模板*/}
          <ListItem title={"客服模板"}>
            <Select
              value={selectZhiNeng}
              onChange={(e) => {
                setSelectZhiNeng(e.target.value);
                //console.log(e.target.value)
              }}
            >
              {zhinengItem.map((v, index) => (
                <option value={v.id} key={index}>
                  {v.name}
                </option>
              ))}
            </Select>
          </ListItem>
          {/*知识库*/}
          {/*<ListItem title={"知识库"}>*/}
          {/*    <Select*/}
          {/*        value={selectNowledgeBase}*/}
          {/*        onChange={(e) => {*/}
          {/*            setSelectNowledgeBase(e.target.value);*/}
          {/*            //console.log(e.target.value)*/}
          {/*        }}*/}
          {/*    >*/}
          {/*        {nowledgeBase.map((v, index) => (*/}
          {/*            <option value={v} key={index}>*/}
          {/*                {v}*/}
          {/*            </option>*/}
          {/*        ))}*/}
          {/*    </Select>*/}
          {/*</ListItem>*/}
          {/*公司名称*/}
          <ListItem title={"公司名称"}>
            <input
              type="text"
              value={corporateName}
              onChange={(e) => {
                setCorporateName(e.target.value);
              }}
              maxLength={10}
            />
          </ListItem>
          {/*  公司logo  */}
          <ListItem title={"公司logo"}>
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
                  src={"data:image/jpeg;base64," + logo}
                  width={50}
                  height={50}
                  onClick={() => {
                    document.getElementById("logo")?.click();
                  }}
                  style={{ borderRadius: "25px" }}
                />
                <input
                  className="file-upload"
                  type="file"
                  accept="image/*"
                  name="logo"
                  id="logo"
                  style={{ display: "none" }}
                  onChange={UploadLogo}
                />
              </div>
            </Popover>
          </ListItem>
          {/*说话风格*/}
          {/*<ListItem title={"说话风格"}>*/}
          {/*    <Select*/}
          {/*        value={selectSpeakingStyle}*/}
          {/*        onChange={(e) => {*/}
          {/*            setSelectSpeakingStyle(e.target.value);*/}
          {/*            //console.log(e.target.value)*/}
          {/*        }}*/}
          {/*    >*/}
          {/*        {speakingStyle.map((v, index) => (*/}
          {/*            <option value={v} key={index}>*/}
          {/*                {v}*/}
          {/*            </option>*/}
          {/*        ))}*/}
          {/*    </Select>*/}
          {/*</ListItem>*/}
          {/*    是否主动打招呼话术*/}
          <ListItem title={"设置招呼语"}>
            <input
              type="checkbox"
              checked={sayHello}
              onChange={(e) => setSayHello(e.currentTarget.checked)}
            ></input>
          </ListItem>
        </List>
        {/*打招呼语设置*/}
        {sayHello && <h3>打招呼语设置</h3>}
        {sayHello && (
          <List>
            <ListItem title={"打招呼语设置"}>
              <input
                type="text"
                value={greeting}
                style={{ width: "100%" }}
                onChange={(e) => {
                  setGreeting(e.target.value);
                }}
              />
            </ListItem>
          </List>
        )}
        <h3 style={{ paddingLeft: "10px" }}>参数设置</h3>
        <List>
          {/*    随机性*/}
          <ListItem
            title={"随机性 (temperature)"}
            subTitle={"值越大，回复越随机"}
          >
            <InputRange
              title={`${temperature}`}
              value={temperature}
              min="0"
              max="1"
              step="0.1"
              leftText={"0"}
              rightText={"1"}
              onChange={(e) => {
                setTemperature(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*    话题新鲜度*/}
          <ListItem
            title={"话题新鲜度 (presence_penalty)"}
            subTitle={"值越大，越有可能扩展到新话题"}
          >
            <InputRange
              title={`${presencePenalty}`}
              value={presencePenalty}
              min="-2"
              max="2"
              step="0.1"
              leftText={"-2"}
              rightText={"2"}
              onChange={(e) => {
                setPresencePenalty(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*    频率惩罚度 (frequency_penalty)*/}
          <ListItem
            title={"频率惩罚度 (frequency_penalty)"}
            subTitle={"值越大，越有可能降低重复字词"}
          >
            <InputRange
              title={`${frequencyPenalty}`}
              value={frequencyPenalty}
              min="-1"
              max="1"
              step="0.1"
              leftText={"-1"}
              rightText={"1"}
              onChange={(e) => {
                setFrequencyPenalty(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*附带历史消息数*/}
          <ListItem
            title={"附带历史消息数"}
            subTitle={"每次请求携带的历史消息数"}
          >
            <InputRange
              title={`${historyMessageCount}`}
              value={historyMessageCount}
              min="0"
              max="64"
              step="1"
              leftText={"0"}
              rightText={"64"}
              onChange={(e) => {
                setHistoryMessageCount(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*历史摘要*/}
          {/*<ListItem title={"历史摘要"}*/}
          {/*          subTitle={"自动压缩聊天记录并作为上下文发送"}>*/}
          {/*    <input*/}
          {/*        type="checkbox"*/}
          {/*        checked={sendMemory == 1 ? true : false}*/}
          {/*        onChange={(e) =>*/}
          {/*            setSendMemory(e.currentTarget.checked ? 1 : 0)*/}
          {/*        }*/}
          {/*    ></input>*/}
          {/*</ListItem>*/}
        </List>
        <h3 style={{ paddingLeft: "10px" }}>高级设置</h3>
        <List>
          {/*    知识库支持模式*/}
          <ListItem
            title={"知识库支持模式"}
            subTitle={"指数字客服基于知识库的哪些内容进行回复。"}
          >
            <Select
              value={chatType}
              onChange={(e) => {
                setChatType(Number(e.target.value));
              }}
            >
              {chatTypeList.map((v, index) => (
                <option value={v.id} key={v.id}>
                  {v.type}
                </option>
              ))}
            </Select>
          </ListItem>
          {/*    问题命中匹配度*/}
          <ListItem
            title={"问题命中匹配度"}
            subTitle={
              "指输入语句和问答库内容的匹配度。匹配度越高，匹配越严格；匹配度越低，匹配越宽泛。"
            }
          >
            <InputRange
              title={`${qaRadius}`}
              value={qaRadius}
              min="0"
              max="1"
              step="0.1"
              leftText={"0"}
              rightText={"1"}
              onChange={(e) => {
                setQaRadius(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*    文本命中匹配度*/}
          <ListItem
            title={"文本命中匹配度"}
            subTitle={
              "指输入语句和文档库内容的匹配度。匹配度越高，匹配越严格；匹配度越低，匹配越宽泛。"
            }
          >
            <InputRange
              title={`${kbRadius}`}
              value={kbRadius}
              min="0"
              max="1"
              step="0.1"
              leftText={"0"}
              rightText={"1"}
              onChange={(e) => {
                setKbRadius(Number(e.currentTarget.value));
              }}
            ></InputRange>
          </ListItem>
          {/*附带历史消息数*/}
          <ListItem
            title={"超纲问题回复"}
            subTitle={"可选择由大模型生成，或者使用自定义兜底话术回复。"}
          >
            <Select
              value={modelSwitch}
              onChange={(e) => {
                setModelSwitch(Number(e.target.value));
              }}
            >
              {modelSwitchList.map((v, index) => (
                <option value={v.id} key={index}>
                  {v.type}
                </option>
              ))}
            </Select>
          </ListItem>
        </List>
        {/*兜底话术列表*/}
        {(modelSwitch == 0 || modelSwitch == 2) && (
          <h3 style={{ paddingLeft: "10px" }}>兜底话术列表</h3>
        )}
        {(modelSwitch == 0 || modelSwitch == 2) && (
          <List>
            {/*是否自定义兜底话术*/}
            <div>
              <div>
                {/*遍历话术*/}
                <div>
                  {scriptArr.map((item, index) => {
                    return (
                      <div key={item.id} style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={item.content}
                          onChange={(e) => {
                            handleInputChange(e, item.id);
                          }}
                          style={{
                            margin: "10px 10px 10px 20px ",
                            minWidth: "96.7%",
                            textAlign: "left",
                            background: rgb(249, 250, 251),
                          }}
                        />
                        {index == scriptArr.length - 1 && (
                          <div
                            style={{
                              position: "absolute",
                              right: "85px",
                              top: "15px",
                            }}
                          >
                            <IconButton
                              icon={<AddIcon />}
                              size={"25"}
                              onClick={() => {
                                handleInputAdd();
                              }}
                            />
                          </div>
                        )}
                        <div
                          style={{
                            position: "absolute",
                            right: "55px",
                            top: "15px",
                          }}
                        >
                          <IconButton
                            icon={<SubIcon />}
                            size={"25"}
                            onClick={() => {
                              //console.log(item.id)
                              handleInputDelete(item.id, index);
                            }}
                          />
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            right: "25px",
                            top: "15px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.enable == 1}
                            onChange={
                              (e) => handleUpdatEnable(e, item.id)
                              // setSayHello(e.currentTarget.checked)
                            }
                          ></input>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </List>
        )}
        {modelSwitch == 2 && <h3>信息量参数设置</h3>}
        {modelSwitch == 2 && (
          <List>
            <ListItem
              title={"信息量"}
              subTitle={
                "值越高，语句内容业务性越强；值越低，语句内容日常性越强。"
              }
            >
              <InputRange
                title={`${quantityOfInformation}`}
                value={quantityOfInformation}
                min="0.5"
                max="5"
                step="0.1"
                leftText={"0.5"}
                rightText={"5"}
                onChange={(e) => {
                  setQuantityOfInformation(Number(e.currentTarget.value));
                }}
              ></InputRange>
            </ListItem>
          </List>
        )}

        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <IconButton
            icon={<CloseIcon />}
            text={"取消设置"}
            bordered
            onClick={() => navigate(Path.Home + "?isTest=1")}
          />
          <IconButton
            icon={<SaveIcon />}
            text={"保存设置"}
            bordered
            onClick={() => SaveSettings()}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
