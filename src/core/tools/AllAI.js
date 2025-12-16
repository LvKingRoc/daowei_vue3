// @ts-nocheck
import { ref } from 'vue';

// AI 工具数据结构（仅文档说明，不使用 TS 接口）：
// AITool: { name: string; url: string; needLogin: boolean; description: string }
// AllAIState: { generalAI; writingAI; devAI; artAI; otherAI }

/**
 * 通用对话AI工具列表
 */
const generalAIData = [
  {
    name: 'DeepSeek Chat（深度求索）',
    url: 'https://www.deepseek.com',
    needLogin: true,
    description: '需手机号、128K长文本、文件上传'
  },
  {
    name: '文心一言（百度）',
    url: 'https://yiyan.baidu.com',
    needLogin: true,
    description: '需百度账号，中文理解强'
  },
  {
    name: '通义千问（阿里云）',
    url: 'https://tongyi.aliyun.com',
    needLogin: true,
    description: '需阿里云账号'
  },
  {
    name: '讯飞星火（科大讯飞）',
    url: 'https://xinghuo.xfyun.cn',
    needLogin: true,
    description: '需手机号注册'
  },
  {
    name: 'Kimi Chat（月之暗面）',
    url: 'https://kimi.moonshot.cn',
    needLogin: false,
    description: '支持128K长文本，部分功能需登录'
  },
  {
    name: '360智脑',
    url: 'https://ai.360.cn',
    needLogin: true,
    description: '360公司出品'
  },
  {
    name: '腾讯混元助手',
    url: 'https://hunyuan.tencent.com',
    needLogin: true,
    description: '需微信登录'
  },
  {
    name: '天工AI',
    url: 'https://www.tiangong.cn',
    needLogin: false,
    description: '昆仑万维出品'
  },
  {
    name: '商量',
    url: 'https://chat.shangliang.ai',
    needLogin: false,
    description: '新华社出品'
  },
  {
    name: '智谱清言',
    url: 'https://chatglm.cn',
    needLogin: true,
    description: '清华智谱出品'
  },
  {
    name: '百川大模型',
    url: 'https://www.baichuan-ai.com/chat',
    needLogin: false,
    description: '百川智能出品，免费使用'
  },
  {
    name: '智谱AI',
    url: 'https://open.bigmodel.cn',
    needLogin: true,
    description: '智谱AI公司出品'
  },
  {
    name: '零一万物',
    url: 'https://ai.01.ai',
    needLogin: true,
    description: '李开复创办'
  },
  {
    name: '书生通用对话',
    url: 'https://shusheng.baai.ac.cn',
    needLogin: true,
    description: '北京智源人工智能研究院'
  }
];

/**
 * 写作AI工具列表
 */
const writingAIData = [
  {
    name: 'WPS AI',
    url: 'https://ai.wps.cn',
    needLogin: true,
    description: '集成在WPS，写PPT/报告'
  },
  {
    name: '秘塔写作猫',
    url: 'https://xiezuocat.com',
    needLogin: false,
    description: '基础功能免登录'
  },
  {
    name: '笔神作文',
    url: 'https://www.bishenapp.com',
    needLogin: true,
    description: '专注写作辅助'
  },
  {
    name: '写作猫',
    url: 'https://xiezuomao.com',
    needLogin: false,
    description: '智能写作助手'
  },
  {
    name: '火龙果写作',
    url: 'https://www.mypitaya.com',
    needLogin: false,
    description: '智能创作平台'
  },
  {
    name: '爱改写',
    url: 'https://www.aigaixie.com',
    needLogin: false,
    description: '文本改写和润色'
  },
  {
    name: '闪卓写作',
    url: 'https://www.aiwritings.cn',
    needLogin: false,
    description: '智能写作平台'
  }
];

/**
 * 开发AI工具列表
 */
const devAIData = [
  {
    name: 'CodeGeeX',
    url: 'https://codegeex.cn',
    needLogin: false,
    description: '清华系代码助手'
  },
  {
    name: 'Comate',
    url: 'https://comate.baidu.com',
    needLogin: true,
    description: '百度代码助手'
  },
  {
    name: '通义灵码',
    url: 'https://tongyi.aliyun.com/lingma',
    needLogin: true,
    description: '阿里云代码助手'
  },
  {
    name: '扣钉',
    url: 'https://coding.koudai.com',
    needLogin: true,
    description: '字节跳动代码助手'
  },
  {
    name: '快速开发助手',
    url: 'https://devai.com.cn',
    needLogin: false,
    description: '国内开发者AI助手'
  }
];

/**
 * 艺术AI工具列表
 */
const artAIData = [
  {
    name: '文心一格',
    url: 'https://yige.baidu.com',
    needLogin: true,
    description: '百度AI绘画'
  },
  {
    name: '即时设计AI',
    url: 'https://js.design',
    needLogin: true,
    description: 'AI辅助设计工具'
  },
  {
    name: '6pen Art',
    url: 'https://6pen.art',
    needLogin: false,
    description: '国产Stable Diffusion'
  },
  {
    name: '腾讯智影',
    url: 'https://zenvideo.qq.com',
    needLogin: true,
    description: '腾讯AI创作平台'
  },
  {
    name: '万兴爱画',
    url: 'https://aigc.wondershare.cn',
    needLogin: false,
    description: '万兴科技AI绘画'
  },
  {
    name: '美图AI创作器',
    url: 'https://ai.meitu.com',
    needLogin: true,
    description: '美图AI绘画创作'
  }
];

/**
 * 其他AI工具列表
 */
const otherAIData = [
  {
    name: '智谱清言',
    url: 'https://chatglm.cn',
    needLogin: true,
    description: '清华轻量版'
  },
  {
    name: '聆心智能',
    url: 'https://www.lingxin.ai',
    needLogin: false,
    description: '心理对话助手'
  },
  {
    name: '彩云小梦',
    url: 'https://if.caiyunai.com',
    needLogin: true,
    description: '小说生成'
  },
  {
    name: '澜舟科技',
    url: 'https://langboat.com',
    needLogin: true,
    description: '孟子模型'
  },
  {
    name: '讯飞智文',
    url: 'https://www.xiaoling.ai',
    needLogin: true,
    description: '讯飞文档助手'
  },
  {
    name: '智谱文档',
    url: 'https://chatdoc.xfyun.cn',
    needLogin: true,
    description: 'PDF智能阅读'
  },
  {
    name: '度加创作',
    url: 'https://aigc.baidu.com',
    needLogin: true,
    description: '百度创作平台'
  },
  {
    name: '智谱翻译',
    url: 'https://translate.chatglm.cn',
    needLogin: false,
    description: '智谱AI翻译'
  },
  {
    name: '讯飞智译',
    url: 'https://fanyi.xfyun.cn',
    needLogin: false,
    description: '讯飞AI翻译'
  }
];

/**
 * 使用AllAI工具的组合式函数
 * @returns AllAI状态和方法
 */
export function useAllAI() {
  // 创建响应式状态
  const state = {
    generalAI: ref(generalAIData),
    writingAI: ref(writingAIData),
    devAI: ref(devAIData),
    artAI: ref(artAIData),
    otherAI: ref(otherAIData)
  };

  /**
   * 打开URL链接
   * @param url 要打开的URL
   */
  const openUrl = (url) => {
    window.open(url, '_blank');
  };

  return {
    ...state,
    openUrl
  };
}

// 导出AI工具数据（用于静态访问）
export {
  generalAIData,
  writingAIData,
  devAIData,
  artAIData,
  otherAIData
};
