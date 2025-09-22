// 省份配置数据 - 基于 backend/a1.md
export const provinceConfig = [
  {
    code: "LN",
    name: "辽宁",
    scServer: "zb-ln-r.toweraiot.cn", // 灾备区注册机域名
    vsrDomain: "ln.toweraiot.cn", // VSR域名
  },
  {
    code: "HL",
    name: "黑龙江",
    scServer: "zb-hl-r.toweraiot.cn",
    vsrDomain: "hl.toweraiot.cn",
  },
  {
    code: "SD",
    name: "山东",
    scServer: "zb-sd-r.toweraiot.cn",
    vsrDomain: "sd.toweraiot.cn",
  },
  {
    code: "SN",
    name: "陕西",
    scServer: "zb-sn-r.toweraiot.cn",
    vsrDomain: "sn.toweraiot.cn",
  },
  {
    code: "FJ",
    name: "福建",
    scServer: "zb-fj-r.toweraiot.cn",
    vsrDomain: "fj.toweraiot.cn",
  },
  {
    code: "HN",
    name: "湖南",
    scServer: "zb-hn-r.toweraiot.cn",
    vsrDomain: "hn.toweraiot.cn",
  },
  {
    code: "GS",
    name: "甘肃",
    scServer: "zb-gs-r.toweraiot.cn",
    vsrDomain: "gs.toweraiot.cn",
  },
  {
    code: "YN",
    name: "云南",
    scServer: "zb-yn-r.toweraiot.cn",
    vsrDomain: "yn.toweraiot.cn",
  },
  {
    code: "XJ",
    name: "新疆",
    scServer: "zb-xj-r.toweraiot.cn",
    vsrDomain: "xj.toweraiot.cn",
  },
  {
    code: "XZ",
    name: "西藏",
    scServer: "zb-xz-r.toweraiot.cn",
    vsrDomain: "xz.toweraiot.cn",
  },
  {
    code: "ZJ",
    name: "浙江",
    scServer: "zb-zj-r.toweraiot.cn",
    vsrDomain: "zj.toweraiot.cn",
  },
  {
    code: "HA",
    name: "河南",
    scServer: "zb-ha-r.toweraiot.cn",
    vsrDomain: "ha.toweraiot.cn",
  },
  {
    code: "HE",
    name: "河北",
    scServer: "zb-he-r.toweraiot.cn",
    vsrDomain: "he.toweraiot.cn",
  },
  {
    code: "SC",
    name: "四川",
    scServer: "zb-sc-r.toweraiot.cn",
    vsrDomain: "sc.toweraiot.cn",
  },
  {
    code: "GZ",
    name: "贵州",
    scServer: "zb-gz-r.toweraiot.cn",
    vsrDomain: "gz.toweraiot.cn",
  },
  {
    code: "JS",
    name: "江苏",
    scServer: "zb-js-r.toweraiot.cn",
    vsrDomain: "js.toweraiot.cn",
  },
  {
    code: "HB",
    name: "湖北",
    scServer: "zb-hb-r.toweraiot.cn",
    vsrDomain: "hb.toweraiot.cn",
  },
  {
    code: "AH",
    name: "安徽",
    scServer: "zb-ah-r.toweraiot.cn",
    vsrDomain: "ah.toweraiot.cn",
  },
  {
    code: "GD",
    name: "广东",
    scServer: "zb-gd-r.toweraiot.cn",
    vsrDomain: "gd.toweraiot.cn",
  },
  {
    code: "GX",
    name: "广西",
    scServer: "zb-gx-r.toweraiot.cn",
    vsrDomain: "gx.toweraiot.cn",
  },
  {
    code: "BJ",
    name: "北京",
    scServer: "zb-bj-r.toweraiot.cn",
    vsrDomain: "bj.toweraiot.cn",
  },
  {
    code: "TJ",
    name: "天津",
    scServer: "zb-tj-r.toweraiot.cn",
    vsrDomain: "tj.toweraiot.cn",
  },
  {
    code: "SX",
    name: "山西",
    scServer: "zb-sx-r.toweraiot.cn",
    vsrDomain: "sx.toweraiot.cn",
  },
  {
    code: "NM",
    name: "内蒙古",
    scServer: "zb-nm-r.toweraiot.cn",
    vsrDomain: "nm.toweraiot.cn",
  },
  {
    code: "JL",
    name: "吉林",
    scServer: "zb-jl-r.toweraiot.cn",
    vsrDomain: "jl.toweraiot.cn",
  },
  {
    code: "SH",
    name: "上海",
    scServer: "zb-sh-r.toweraiot.cn",
    vsrDomain: "sh.toweraiot.cn",
  },
  {
    code: "JX",
    name: "江西",
    scServer: "zb-jx-r.toweraiot.cn",
    vsrDomain: "jx.toweraiot.cn",
  },
  {
    code: "HI",
    name: "海南",
    scServer: "zb-hi-r.toweraiot.cn",
    vsrDomain: "hi.toweraiot.cn",
  },
  {
    code: "CQ",
    name: "重庆",
    scServer: "zb-cq-r.toweraiot.cn",
    vsrDomain: "cq.toweraiot.cn",
  },
  {
    code: "QH",
    name: "青海",
    scServer: "zb-qh-r.toweraiot.cn",
    vsrDomain: "qh.toweraiot.cn",
  },
  {
    code: "NX",
    name: "宁夏",
    scServer: "zb-nx-r.toweraiot.cn",
    vsrDomain: "nx.toweraiot.cn",
  },
];

// 根据SC服务器地址生成MainVPN
export const generateMainVPN = (scServerAddress) => {
  if (!scServerAddress) return "";

  const province = provinceConfig.find((p) => p.scServer === scServerAddress);
  if (province) {
    return `${province.vsrDomain},${province.vsrDomain}`;
  }

  return "";
};

// 获取SC服务器选项列表
export const getScServerOptions = () => {
  return provinceConfig.map((province) => ({
    value: province.scServer,
    label: `${province.name} (${province.scServer})`,
    code: province.code,
    vsrDomain: province.vsrDomain,
  }));
};
