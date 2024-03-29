export default {
  // baseUrl 指的是后端服务的地址 加入/prod-api使用nginx反向代理访问
  // 注意：如果后端服务没有使用反向代理，则 baseURL 应该配置为后端服务的真实地址
  // baseURL:"http://192.168.1.16:8080",
  baseURL:"https://autoai.aicyber.com:8202/prod-api",
  // baseURL: "http://127.0.0.1:28002/prod-api",
  // shareUrl指的是 在管理系统后台进入的智能客服对话页面访问的地址
  // 注意: 如果想在浏览器中直接访问对话页面 需要指定身份 在url后边加入 参数即可 例如http://127.0.0.1:28001/#/?isVisitor=1&id=78
  // isVisitor=1 代表访问模式为访客模式 id=78 代表 使用第78号客服进行对话
  shareURL: "https://autoai.aicyber.com:8201",
  // shareURL: "http://127.0.0.1:28001",
};
