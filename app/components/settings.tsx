import {useState, useEffect, useMemo} from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import SaveIcon from "../icons/copy.svg"
import baseConfig from "../config/url";
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
import {ModelConfigList} from "./model-config";

import {IconButton} from "./button";
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
import {copyToClipboard} from "../utils";
import Link from "next/link";
import {Path, RELEASE_URL, UPDATE_URL} from "../constant";
import {Prompt, SearchService, usePromptStore} from "../store/prompt";
import {ErrorBoundary} from "./error";
import {InputRange} from "./input-range";
import {useNavigate} from "react-router-dom";
import {Avatar, AvatarPicker} from "./emoji";
import {getClientConfig} from "../config/client";
import {useSyncStore} from "../store/sync";
import {nanoid} from "nanoid";
import axios from "axios";
import ReturnIcon from "@/app/icons/return.svg";
import {rgb} from "khroma";
import {log} from "mermaid/dist/logger";
import {s} from "hastscript";


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

        console.log("[Update] local version ", updateStore.version);
        console.log("[Update] remote version ", updateStore.remoteVersion);
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
    // 员工名称
    const [employeeName, setEmployeeName] = useState("");
    //工作职能列表
    const [zhinengItem, setZhineng] = useState([{
        id: "",
        name: ""
    }]);
    //选中的工作职能
    const [selectZhiNeng, setSelectZhiNeng] = useState("");
    //知识库列表
    const [nowledgeBase, setNowledgeBase] = useState(["无", "知识库一", "知识库二", "知识库三",])
    //选中的知识库
    const [selectNowledgeBase, setSelectNowledgeBase] = useState("无");
    //公司名称
    const [corporateName, setCorporateName] = useState("");
    // 公司LOGO
    const [logo, setLogo] = useState("");
    //说话风格
    const [speakingStyle, setSpeakingStyle] = useState(["亲切", "幽默", "活泼", "商务"]);
    //选中的说话风格
    const [selectSpeakingStyle, setSelectSpeakingStyle] = useState("");
    // 是否主动打招呼
    const [sayHello, setSayHello] = useState(true);
    // 创造性
    const [creativeness, setCreativeness] = useState(5);
    // 干预相似问闽值
    const [interventionSimilarityThreshold, setInterventionSimilarityThreshold] = useState(0)
    // 是否展示引用
    const [showReferences, setShowReferences] = useState(true);
    // 是否展示问题引用
    const [showProblemRecommendations, setShowProblemRecommendations] = useState(true);
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
            text: "对不起，我没有听清"
        },
        {
            id: "2",
            text: "抱歉暂时我不能回答"
        },
        {
            id: "3",
            text: "请您再说一遍"
        },
    ])

    // 随机性
    const [temperature, setTemperature] = useState(0.4);
    // 话题新鲜度
    const [presencePenalty, setPresencePenalty] = useState(1);
    //频率惩罚度
    const [frequencyPenalty, setFrequencyPenalty] = useState(0.5);
    // 历史消息数
    const [historyMessageCount, setHistoryMessageCount] = useState(4);
    // 历史摘要
    const [sendMemory, setSendMemory] = useState(1)

    const query = new URLSearchParams(location.search);
    useEffect(() => {
        const id = window.localStorage.getItem("employeeId");
        const templateId = window.localStorage.getItem("templateId");
        const token = window.localStorage.getItem("header");
        //   获取数字员工详情信息
        getEmployeeInformation();
        // //     获取数字员工对应的模板信息
        // axios({
        //     url: `http://localhost/dev-api/de/employeeTemplate/${templateId}`,
        //     method: "get",
        //     headers: {
        //         "Authorization": token
        //     }
        // }).then((res) => {
        //     // @ts-ignore
        //     if (res.data.code == 200) {
        //         console.log("模板获取成功", res)
        //
        //     }
        // })
        //     获取所有模板列表
        axios({
            // url: "http://localhost/dev-api/de/employeeTemplate/selectList",
            url: baseConfig.baseURL + "/de/employeeTemplate/selectList",
            method: "get",
            headers: {
                "Authorization": token
            }
        }).then((res) => {
            if (res.data.code == 200) {
                let arr = [];
                for (let item of res.data.data) {
                    let obj = {
                        id: item.id,
                        name: item.name
                    }
                    arr.push(obj)
                }
                // @ts-ignore
                setZhineng(arr)
            }
        })
    }, []);
    // 获取数字员工信息
    const getEmployeeInformation = () => {
        const id = window.localStorage.getItem("employeeId");
        const templateId = window.localStorage.getItem("templateId");
        const token = window.localStorage.getItem("header");
        axios({
            // url: `http://localhost/dev-api/de/digitalEmployee/${id}`,
            url: baseConfig.baseURL + `/de/digitalEmployee/${id}`,
            method: "get",
            headers: {
                "Authorization": token
            }
        }).then((res) => {

            // @ts-ignore
            if (res.data.code == 200) {
                console.log("数字员工获取成功", res)
                setTemperature(res.data.data.temperature??0.5);
                setPresencePenalty(res.data.data.presencePenalty??0);
                setFrequencyPenalty(res.data.data.frequencyPenalty??0);
                setHistoryMessageCount(res.data.data.historyMessageCount??4);
                setSayHello((res.data.data.proactivelyGreet==0||res.data.data.proactivelyGreet==null)?false:true)
                setSendMemory(res.data.data.sendMemory);
                // 设置选中的模板id
                setSelectZhiNeng(res.data.data.templateId);
                // 设置数字员工名称
                setEmployeeName(res.data.data.name);
                axios({
                    // url: `http://localhost/dev-api/de/employeeTemplate/${res.data.data.templateId}`,
                    url: baseConfig.baseURL + `/de/employeeTemplate/${res.data.data.templateId}`,
                    method: "get",
                    headers: {
                        "Authorization": token
                    }
                }).then((templateRes) => {
                    // @ts-ignore
                    if (templateRes.data.code == 200) {
                        !res.data.data.companyName ? setCorporateName(templateRes.data.data.companyName) : setCorporateName(res.data.data.companyName)
                        !res.data.data.avatar ? setAvatar(templateRes.data.data.avatar) : setAvatar(res.data.data.avatar)
                        !res.data.data.companyAvatar ? setLogo(templateRes.data.data.companyAvatar) : setLogo(res.data.data.companyAvatar)
                    }
                })
            }
        })
    }

    // 获取角色信息
    const getInfo = () => {

    }
    // 修改角色头像上传
    const UploadAvatar = () => {
        // @ts-ignore
        const file = document.getElementById("picture").files[0];
        console.log("file", file);
        const employeeId = window.localStorage.getItem("employeeId");
        var formdata = new FormData()
        formdata.append("file", file)
        formdata.append("employeeId", employeeId as string);
        axios({
            url: baseConfig.baseURL + "/de/digitalEmployee/uploadAvatar",
            // url: "http://127.0.0.1:8080" + "/de/chat/uploadUserAvatar",
            method: "post",
            data: formdata,
            headers: {
                "Authorization": "Bearer " + window.localStorage.getItem("header")
            }
        }).then((res) => {
            console.log("返回结果", res);
            getEmployeeInformation()
        })
    }
    // 修改公司logo
    const UploadLogo = () => {
        // @ts-ignore
        const logoFile = document.getElementById("logo").files[0];
        console.log("logoFile", logoFile);
        const employeeId = window.localStorage.getItem("employeeId");
        var formdata = new FormData()
        formdata.append("file", logoFile)
        formdata.append("employeeId", employeeId as string)
        axios({
            url: baseConfig.baseURL + "/de/digitalEmployee/uploadCompanyAvatar",
            method: "post",
            data: formdata,
            headers: {
                "Authorization": "Bearer " + window.localStorage.getItem("header")
            }
        }).then((res) => {
            console.log("返回结果", res);
            getEmployeeInformation()
        })
    }

    // 保存设置
    const SaveSettings = () => {
        axios({
            url: baseConfig.baseURL + "/de/digitalEmployee",
            // url:"http://127.0.0.1:8080"+"/de/digitalEmployee",
            method: "put",
            headers: {
                "Authorization": "Bearer " + window.localStorage.getItem("header")
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
                proactivelyGreet: sayHello?1:0,
            }
        }).then((res) => {
            if (res.data.code == 200) {
                // getEmployeeInformation()
                navigate(Path.Home + "?isTest=1")
            }
        })
    }


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
                            icon={<CloseIcon/>}
                            onClick={() => navigate(Path.Home + "?isTest=1")}
                            bordered
                        />
                    </div>
                </div>
            </div>

            <div className={styles["settings"]}>
                <h3 style={{paddingLeft: "10px"}}>员工设置</h3>
                <List>
                    {/*  头像  */}
                    <ListItem title={Locale.Settings.Avatar} subTitle={"头像图片上传大小在1M以内"}>
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
                            <div
                                className={styles.avatar}
                            >
                                {/*<Avatar avatar={config.avatar}/>*/}
                                <img src={"data:image/jpeg;base64," + avatar} width={50} height={50}
                                     onClick={() => {
                                         document.getElementById("picture")?.click();
                                     }} style={{borderRadius: "25px"}}/>
                                <input className="file-upload" type="file" accept="image/*" name="picture" id="picture"
                                       style={{display: "none"}} onChange={UploadAvatar}/>
                            </div>
                        </Popover>
                    </ListItem>
                    {/*员工昵称*/}
                    <ListItem
                        title={"员工昵称"}
                    >
                        <input type="text" value={employeeName} onChange={(e) => {
                            setEmployeeName(e.target.value)
                        }} maxLength={10}/>
                    </ListItem>
                    {/*工作职能*/}
                    <ListItem title={"工作职能"}>
                        <Select
                            value={selectZhiNeng}
                            onChange={(e) => {
                                setSelectZhiNeng(e.target.value)
                                console.log(e.target.value)
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
                    <ListItem title={"知识库"}>
                        <Select
                            value={selectNowledgeBase}
                            onChange={(e) => {
                                setSelectNowledgeBase(e.target.value);
                                console.log(e.target.value)
                            }}
                        >
                            {nowledgeBase.map((v, index) => (
                                <option value={v} key={index}>
                                    {v}
                                </option>
                            ))}
                        </Select>
                    </ListItem>
                    {/*公司名称*/}
                    <ListItem
                        title={"公司名称"}
                    >
                        <input type="text" value={corporateName} onChange={(e) => {
                            setCorporateName(e.target.value)
                        }} maxLength={10}/>
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
                            <div
                                className={styles.avatar}
                            >
                                {/*<Avatar avatar={config.avatar}/>*/}
                                <img src={"data:image/jpeg;base64," + logo} width={50} height={50}
                                     onClick={() => {
                                         document.getElementById("logo")?.click();
                                     }} style={{borderRadius: "25px"}}/>
                                <input className="file-upload" type="file" accept="image/*" name="logo" id="logo"
                                       style={{display: "none"}} onChange={UploadLogo}/>
                            </div>
                        </Popover>
                    </ListItem>
                    {/*说话风格*/}
                    {/*<ListItem title={"说话风格"}>*/}
                    {/*    <Select*/}
                    {/*        value={selectSpeakingStyle}*/}
                    {/*        onChange={(e) => {*/}
                    {/*            setSelectSpeakingStyle(e.target.value);*/}
                    {/*            console.log(e.target.value)*/}
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
                    <ListItem title={"是否主动打招呼"}>
                        <input
                            type="checkbox"
                            checked={sayHello}
                            onChange={(e) =>
                                setSayHello(e.currentTarget.checked)
                            }
                        ></input>
                    </ListItem>
                </List>
                <h3 style={{paddingLeft: "10px"}}>参数设置</h3>
                <List>
                    {/*/!*创造性*!/*/}
                    {/*<ListItem title={"创造性"}*/}
                    {/*          subTitle={"取值范围:0-10的整数，数值越大，回答内容的创造性越强。如果是0，每次回答都尽可能一样"}>*/}
                    {/*    <InputRange*/}
                    {/*        title={`${creativeness}`}*/}
                    {/*        value={creativeness}*/}
                    {/*        min="0"*/}
                    {/*        max="10"*/}
                    {/*        step="1"*/}
                    {/*        leftText={"0"}*/}
                    {/*        rightText={"10"}*/}
                    {/*        onChange={(e) => {*/}
                    {/*            setCreativeness(Number(e.currentTarget.value));*/}
                    {/*        }}*/}
                    {/*    ></InputRange>*/}
                    {/*</ListItem>*/}
                    {/*/!*千预相似问闽值*!/*/}
                    {/*<ListItem title={"千预相似问闽值"} subTitle={"调节干预问的阙值。越精准，相似问匹配要求越严格"}>*/}
                    {/*    <InputRange*/}
                    {/*        title={`${interventionSimilarityThreshold}`}*/}
                    {/*        value={interventionSimilarityThreshold}*/}
                    {/*        min="-10"*/}
                    {/*        max="10"*/}
                    {/*        step="1"*/}
                    {/*        leftText={"较宽泛"}*/}
                    {/*        rightText={"较精准"}*/}
                    {/*        onChange={(e) => {*/}
                    {/*            setInterventionSimilarityThreshold(Number(e.currentTarget.value));*/}
                    {/*        }}*/}
                    {/*    ></InputRange>*/}
                    {/*</ListItem>*/}
                    {/*/!*    是否展示引用*!/*/}
                    {/*<ListItem title={"是否展示引用"}*/}
                    {/*          subTitle={"默认开启，开关关闭后，机器人的聊天内容后将不展示引用来源"}>*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={showReferences}*/}
                    {/*        onChange={(e) =>*/}
                    {/*            setShowReferences(e.currentTarget.checked)*/}
                    {/*        }*/}
                    {/*    ></input>*/}
                    {/*</ListItem>*/}
                    {/*/!*    是否展示引用问题推荐*!/*/}
                    {/*<ListItem title={"是否展示引用问题推荐"}*/}
                    {/*          subTitle={"默认开启，开关关闭后，机器人的聊天内容后将不展示推荐问题"}>*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={showProblemRecommendations}*/}
                    {/*        onChange={(e) =>*/}
                    {/*            setShowProblemRecommendations(e.currentTarget.checked)*/}
                    {/*        }*/}
                    {/*    ></input>*/}
                    {/*</ListItem>*/}
                    {/*/!*  主动推荐  *!/*/}
                    {/*<ListItem title={"主动推荐"} subTitle={"默认开启，开关关闭，进入聊天界面不会主动展示内容"}>*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={proactivelyRecommend}*/}
                    {/*        onChange={(e) =>*/}
                    {/*            setProactivelyRecommend(e.currentTarget.checked)*/}
                    {/*        }*/}
                    {/*    ></input>*/}
                    {/*</ListItem>*/}
                    {/*/!*    回答丰富性*!/*/}
                    {/*<ListItem title={"回答丰富性"} subTitle={"默认开启，开关关闭，回复的内容较为简短精炼"}>*/}
                    {/*    <input*/}
                    {/*        type="checkbox"*/}
                    {/*        checked={richAnswers}*/}
                    {/*        onChange={(e) =>*/}
                    {/*            setRichAnswers(e.currentTarget.checked)*/}
                    {/*        }*/}
                    {/*    ></input>*/}
                    {/*</ListItem>*/}


                    {/*    随机性*/}
                    <ListItem title={"随机性 (temperature)"}
                              subTitle={"值越大，回复越随机"}>
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
                    <ListItem title={"话题新鲜度 (presence_penalty)"}
                              subTitle={"值越大，越有可能扩展到新话题"}>
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
                    <ListItem title={"频率惩罚度 (frequency_penalty)"}
                              subTitle={"值越大，越有可能降低重复字词"}>
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
                    <ListItem title={"附带历史消息数"}
                              subTitle={"每次请求携带的历史消息数"}>
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
                {/*    自定义*/}
                {/*<h3 style={{paddingLeft: "10px"}}>自定义</h3>*/}
                {/*<List>*/}
                {/*    /!*是否自定义兜底话术*!/*/}
                {/*    <ListItem title={"是否自定义兜底话术"}>*/}
                {/*        <input*/}
                {/*            type="checkbox"*/}
                {/*            checked={backdoorStorytelling}*/}
                {/*            onChange={(e) =>*/}
                {/*                setBackdoorStorytelling(e.currentTarget.checked)*/}
                {/*            }*/}
                {/*        ></input>*/}
                {/*    </ListItem>*/}
                {/*    <div>*/}
                {/*        {*/}
                {/*            backdoorStorytelling && <div>*/}
                {/*                <div style={{width: "100%", display: "flex", alignItems: "center"}}>*/}
                {/*                    <input type="text" style={{*/}
                {/*                        margin: "10px 10px 10px 20px ",*/}
                {/*                        minWidth: "88%",*/}
                {/*                        textAlign: "left",*/}
                {/*                        background: rgb(249, 250, 251)*/}
                {/*                    }} maxLength={20} placeholder={"请输入兜底话术 (点击回车或右侧 '+' 按钮)"}/>*/}
                {/*                    <IconButton icon={<AddIcon/>} text={"添加话术"} shadow bordered/>*/}
                {/*                </div>*/}
                {/*                /!*遍历话术*!/*/}
                {/*                <div>*/}
                {/*                    {*/}
                {/*                        scriptArr.map((item) => {*/}
                {/*                            return <div key={item.id} style={{position: "relative"}}>*/}
                {/*                                <input type="text" value={item.text} style={{*/}
                {/*                                    margin: "10px 10px 10px 20px ",*/}
                {/*                                    minWidth: "96.7%",*/}
                {/*                                    textAlign: "left",*/}
                {/*                                    background: rgb(249, 250, 251)*/}
                {/*                                }}/>*/}
                {/*                                <div style={{position: "absolute", right: "25px", top: "15px"}}>*/}
                {/*                                    <IconButton icon={<CloseIcon/>} size={"25"} onClick={() => {*/}
                {/*                                        console.log(item.id)*/}
                {/*                                    }}/>*/}
                {/*                                </div>*/}
                {/*                            </div>*/}
                {/*                        })*/}

                {/*                    }*/}
                {/*                </div>*/}
                {/*            </div>*/}
                {/*        }*/}
                {/*    </div>*/}
                {/*</List>*/}
                <div style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "space-evenly"}}>
                    <IconButton icon={<CloseIcon/>} text={"取消设置"} bordered
                                onClick={() => navigate(Path.Home + "?isTest=1")}/>
                    <IconButton icon={<SaveIcon/>} text={"保存设置"} bordered onClick={() => SaveSettings()}/>
                </div>

            </div>
        </ErrorBoundary>
    );
}
