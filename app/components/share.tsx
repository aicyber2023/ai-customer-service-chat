import { ErrorBoundary } from "./error";
import Locale from "@/app/locales";
import { IconButton } from "@/app/components/button";
import CloseIcon from "@/app/icons/close.svg";
import { Path } from "@/app/constant";
import { useNavigate } from "react-router-dom";
import styles from "./share.module.scss";
import { useEffect, useState } from "react";
import { Simulate } from "react-dom/test-utils";
import copy = Simulate.copy;
import { api } from "@/app/client/api";
import { rgb } from "khroma";
import { List, ListItem, showConfirm } from "./ui-lib";
import baseURL from "@/app/config/url";
import axios from "axios";
import baseConfig from "@/app/config/url";

export function Share() {
  const navigate = useNavigate();
  //连接分享状态是否开启
  const [shareLinkState, setShareLinkState] = useState(true);
  // 分享成功的url
  const [successCopyURL, setSuccessCopyURL] = useState("");
  //网页分享地址 第一个input的值
  const [shareLink, setShareLink] = useState(baseURL.shareURL);
  //嵌入到其他页面的 input输入框的值
  const [implant, setImplant] = useState("");
  //API接入
  const [Api, setApi] = useState("");
  //是否复制成功
  const [copySuccess, setCopySuccess] = useState(false);
  // API模板
  const [showTemplateHtml, setShowTemplateHtml] = useState("");
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const employeeId = window.localStorage.getItem("employeeId");
    const templateId = window.localStorage.getItem("templateId");
    const templateText = `
<iframe
    src="${baseURL.shareURL}/#/?isVisitor=1&id=${employeeId}&templateId=${templateId}"
    style="width: 400px;height: 500px;border: 1px solid #ccc;border-radius:25px ;"
    allow="clipboard-read; clipboard-write">
     <p>Your browser does not support iframes.</p>
</iframe>
        `;
    const showTemplateHtml = `
√复制成功 请将代码粘贴到您网站的<body>部分 
<iframe
  src="${baseURL.shareURL}/#/?isVisitor=1&id=${employeeId}&templateId=${templateId}"
  style="width: 400px;height: 500px;border: 1px solid #ccc;border-radius:25px ;"
  allow="clipboard-read; clipboard-write">
    <p>Your browser does not support iframes.</p>
</iframe>        
        `;
    setImplant(templateText);
    setShowTemplateHtml(showTemplateHtml);
    setShareLink(
      baseURL.shareURL +
        `?createBy=${
          query.get("createBy") || window.localStorage.getItem("createBy")
        }`,
    );
    //     获取API字符串
    regeneration(false);
  }, []);
  //一键复制
  const muCopy = async (
    text: string | undefined,
    msg: string,
    isApi: boolean = false,
  ) => {
    // navigator clipboard 需要https等安全上下文
    if (navigator.clipboard && window.isSecureContext) {
      // navigator clipboard 向剪贴板写文本
      await navigator.clipboard
        .writeText(typeof text === "string" ? text : "")
        .then(() => {
          setCopySuccess(true);
          if (isApi) {
            //console.log("true")
            setSuccessCopyURL(showTemplateHtml);
          } else {
            setSuccessCopyURL((msg + text) as string);
          }
          setTimeout(() => {
            setCopySuccess(false);
          }, 2000);
        });
    } else {
      var textArea = document.createElement("textarea");
      textArea.value = text as string;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {}
      document.body.removeChild(textArea);
      setCopySuccess(true);
      if (isApi) {
        setSuccessCopyURL(showTemplateHtml);
      } else {
        setSuccessCopyURL((msg + text) as string);
      }
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    }
  };
  // 重新生成并复制
  const regeneration = (isCopy: boolean) => {
    axios({
      url: baseConfig.baseURL + "/de/chatToken/generateAppToken",
      method: "get",
      headers: {
        Authorization: "Bearer " + window.localStorage.getItem("header"),
      },
    }).then((res) => {
      //console.log(res)
      if (res.data.code == 200) {
        setApi(res.data.msg);
        if (isCopy) {
          muCopy(res.data.msg, "√复制成功 ");
        }
      }
    });
  };

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">{"分享"}</div>
          <div className="window-header-sub-title">{"设置分享"}</div>
          {copySuccess && (
            <div className={styles.copySuccess}>
              <pre>{successCopyURL} </pre>
            </div>
          )}
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
      <div className={styles["myShare"]}>
        {/*<div className={styles.main}>*/}
        {/*    <div className={styles.nav}>*/}
        {/*        <div className={[styles.navItem,selectNavItem=='1'&&styles.navItemActive].join(" ")} onClick={()=>{setSelectNavItem("1")}}>网页分享地址</div>*/}
        {/*        <div className={[styles.navItem,selectNavItem=='2'&&styles.navItemActive].join(" ")} onClick={()=>{setSelectNavItem("2")}}>嵌入到其他网页</div>*/}
        {/*        <div className={[styles.navItem,selectNavItem=='3'&&styles.navItemActive].join(" ")} onClick={()=>{setSelectNavItem("3")}}>API接入</div>*/}
        {/*    </div>*/}
        {/*    {*/}
        {/*        selectNavItem=="1"&&<div className={styles.content}>*/}
        {/*            <div className={styles.title}>*/}
        {/*                <span>链接分享</span>*/}
        {/*                <div className={styles.onOrOff} onClick={()=>{updateShareLinkState()}} style={{cursor:"pointer"}}>*/}
        {/*                    <div className={styles.on} style={{backgroundColor:shareLinkState?rgb(52,73,94):rgb(228,228,228)}}>{shareLinkState?'打开':''}</div>*/}
        {/*                    <div className={styles.off} style={{backgroundColor:shareLinkState?rgb(22,155,213):rgb(204,204,204)}}>{shareLinkState?'':'关闭'}</div>*/}
        {/*                </div>*/}
        {/*            </div>*/}
        {/*            <div className={styles.desc}>*/}
        {/*                <span>您可以复制并与团队或者客户分享</span>*/}
        {/*                <input type="text" value={shareLink} onChange={(e)=>{setShareLink(e.target.value)}} placeholder={"开关开启后,分享URL将会展示并生效"}/>*/}
        {/*                {*/}
        {/*                    shareLinkState&&<button onClick={()=>{muCopy(shareLink)}}>一键复制</button>*/}
        {/*                }*/}
        {/*            </div>*/}
        {/*            <div className={styles.illustrate}>*/}
        {/*                <span>添加说明</span>*/}
        {/*                <input type="text" placeholder={"快来试试最火的AI聊天机器人吧,他会给你带来想象不到的体验"}/>*/}
        {/*                {*/}
        {/*                    shareLinkState&&<button onClick={()=>{saveIllustrate()}}>保存</button>*/}
        {/*                }*/}
        {/*            </div>*/}
        {/*        </div>*/}
        {/*    }*/}
        {/*    {*/}
        {/*        selectNavItem=="2"&&<div className={styles.content}>*/}

        {/*            <div className={styles.desc}>*/}
        {/*                <span>您可以复制并与团队或者客户分享</span>*/}
        {/*                <textarea value={implant} onChange={(e)=>{setImplant(e.target.value)}}/>*/}
        {/*                <button onClick={()=>{muCopy(implant)}}>一键复制</button>*/}
        {/*                <span>复制一下代码并将其粘贴到您旺山的&lt;body&gt;部分,您希望在此处呈现聊天机器人框和生成的响应</span>*/}
        {/*            </div>*/}

        {/*        </div>*/}
        {/*    }*/}
        {/*    {*/}
        {/*        selectNavItem=="3"&&<div className={styles.content}>*/}

        {/*            <div className={styles.desc}>*/}
        {/*                <span><b>Key:</b></span>*/}
        {/*                <input type="text" value={Api} onChange={(e)=>{setApi(e.target.value)}}/>*/}
        {/*                <span style={{color:rgb(108,43,271),cursor:"pointer",width:"max-content"}}><b>API文档</b></span>*/}
        {/*                <div style={{display:"flex"}}>*/}
        {/*                    <button style={{marginRight:'10px'}} onClick={()=>{muCopy(Api)}}>一键复制</button>*/}
        {/*                    <button onClick={()=>{regeneration()}}>重新生成</button>*/}
        {/*                </div>*/}

        {/*            </div>*/}

        {/*        </div>*/}
        {/*    }*/}
        {/*</div>*/}

        <List>
          <ListItem
            title={"网页地址分享"}
            subTitle={"您可以复制并与您的团队或客户分享"}
          >
            <div style={{ display: "flex" }}>
              {/*<div style={{ marginRight: "20px" }}>*/}
              {/*  <IconButton*/}
              {/*    onClick={() => {*/}
              {/*      muCopy(shareLink, "√复制成功 ");*/}
              {/*    }}*/}
              {/*    text={"复制登录用户地址"}*/}
              {/*  />*/}
              {/*</div>*/}
              <div>
                <IconButton
                  text={"复制访客地址"}
                  onClick={() => {
                    muCopy(
                      `${
                        baseURL.shareURL
                      }/#/?isVisitor=1&id=${window.localStorage.getItem(
                        "employeeId",
                      )}&templateId=${window.localStorage.getItem(
                        "templateId",
                      )}`,
                      "√复制成功 ",
                    );
                  }}
                />
              </div>
            </div>
          </ListItem>
          <ListItem
            title={"嵌入到其它网页"}
            subTitle={"复制代码并粘贴到您网站的<body>部分"}
          >
            <IconButton
              text={"一键复制"}
              onClick={() => {
                muCopy(implant, "", true);
              }}
            />
          </ListItem>
          {/*<ListItem title={"API接入"}>*/}
          {/*  <div style={{ display: "flex" }}>*/}
          {/*    <div style={{ marginRight: "20px" }}>*/}
          {/*      <IconButton*/}
          {/*        onClick={() => {*/}
          {/*          muCopy(Api, "√复制成功 ");*/}
          {/*        }}*/}
          {/*        text={"一键复制"}*/}
          {/*      />*/}
          {/*    </div>*/}
          {/*    <div>*/}
          {/*      <IconButton*/}
          {/*        text={"重新生成并复制"}*/}
          {/*        onClick={() => {*/}
          {/*          regeneration(true);*/}
          {/*        }}*/}
          {/*      />*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</ListItem>*/}
          {/*<ListItem*/}
          {/*  title={"API文档"}*/}
          {/*  // subTitle={"复制代码并粘贴到您网站的<body>部分"}*/}
          {/*>*/}
          {/*  <IconButton text={"查看文档"} />*/}
          {/*</ListItem>*/}
        </List>
      </div>
    </ErrorBoundary>
  );
}
