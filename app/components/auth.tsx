import styles from "./auth.module.scss";
import { IconButton } from "./button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore, useChatStore } from "../store";
import Locale from "../locales";
import baseConfig from "../../public/url";
import BotIcon from "../icons/bot.svg";
import { useEffect, useState } from "react";
import { getClientConfig } from "../config/client";

export function AuthPage() {
  const navigate = useNavigate();
  const access = useAccessStore();

  const goHome = () => {
    navigate(Path.Home);
    //console.log("跳转到Home");
  };

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [chatUserName, setChatUserName] = useState("");
  const [codeObj, setCodeObj] = useState({
    data: {
      uuid: "",
      img: "",
    },
  });
  const chatStore = useChatStore();
  const [imgCode, setImgCode] = useState("");
  const query = new URLSearchParams(location.search);
  useEffect(() => {
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/captchaImage",
      // url:"http://192.168.1.121:8080"+"/captchaImage",
    }).then((res) => {
      //console.log("codeRes:", res);
      setCodeObj(res);
    });
    setUserName(query.get("createBy") ?? "");
  }, []);

  const getCode = () => {
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/captchaImage",
      // url:"http://192.168.1.121:8080"+"/captchaImage",
    }).then((res) => {
      setCodeObj(res);
    });
  };
  const login = () => {
    axios({
      // @ts-ignore
      url: baseConfig.baseURL + "/de/chat/login",
      // url:"http://192.168.1.121:8080"+"/de/chat/login",
      method: "post",
      data: {
        username: userName,
        password: password,
        code: imgCode,
        chatUserName: chatUserName,
        uuid: codeObj.data.uuid,
      },
    }).then((res) => {
      //console.log("登录res", res);
      if (res.data.code == 200) {
        window.localStorage.setItem("token", res.data.msg);
        window.localStorage.removeItem("visitor");
        goHome();
        //     获取聊天记录
        // axios({
        //   url: baseConfig.chatUrl + "/chat-history.do",
        //   method: "post",
        //   headers: {
        //     "Chat-Auth": localStorage.getItem("token"),
        //   },
        // }).then((res) => {
        //   //console.log("history",res.data)
        //   // chatStore.clearSessions()
        //   // chatStore.newSession(res.data)
        //   setTimeout(() => {
        //     chatStore.setSessions(res.data.state.sessions);
        //     localStorage.setItem(
        //       "employeeId",
        //       res.data.state.sessions[0].mask.id,
        //     );
        //   }, 1000);
        // });
      } else {
        alert(res.data.msg);
        //重新获取验证码
        getCode();
      }
    });
  };

  return (
    // <div className={styles["auth-page"]}>
    //   {/*<div className={`no-dark ${styles["auth-logo"]}`}>*/}
    //   {/*  <BotIcon />*/}
    //   {/*</div>*/}
    //
    //   <div className={styles["auth-title"]}>需要验证身份</div>
    //   <div className={styles["auth-tips"]}>验证通过即可进入</div>
    //
    //   {/*  用户名*/}
    //   <input
    //     className={styles["auth-input"]}
    //     type="text"
    //     placeholder="请填写企业账号"
    //     value={userName}
    //     onChange={(e) => {
    //       setUserName(e.currentTarget.value);
    //     }}
    //   />
    //   {/*用户ID*/}
    //   <input
    //     className={styles["auth-input"]}
    //     type="text"
    //     placeholder="请填写用户名称"
    //     value={chatUserName}
    //     onChange={(e) => {
    //       setChatUserName(e.currentTarget.value);
    //     }}
    //   />
    //   {/*密码*/}
    //   <input
    //     className={styles["auth-input"]}
    //     type="password"
    //     placeholder="请填写密码"
    //     value={password}
    //     onChange={(e) => {
    //       setPassword(e.currentTarget.value);
    //     }}
    //   />
    //
    //   <div className={styles["code"]}>
    //     <input
    //       type="text"
    //       placeholder={"请输入验证码"}
    //       value={imgCode}
    //       onChange={(e) => {
    //         setImgCode(e.target.value);
    //       }}
    //     />
    //     <img
    //       src={"data:image/jpeg;base64," + codeObj.data.img}
    //       onClick={() => {
    //         getCode();
    //       }}
    //       width={80}
    //       height={40}
    //     />
    //   </div>
    //
    //   <div className={styles["auth-actions"]}>
    //     <IconButton
    //       text={"登录"}
    //       type="primary"
    //       onClick={() => {
    //         login();
    //       }}
    //     />
    //     {/*<IconButton text={"稍后登录"} onClick={()=>{*/}
    //     {/*    window.localStorage.setItem("visitor",String(true));*/}
    //     {/*    goHome()*/}
    //     {/*}} />*/}
    //   </div>
    // </div>
    <div className={styles["errorPage"]}></div>
  );
}
