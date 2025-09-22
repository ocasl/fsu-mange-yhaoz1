// 省份配置数据 - 基于 backend/a1.md
export const provinceConfig = [
  // 正常服务器地址（不带zb-前缀）
  {
    code: "LN",
    name: "辽宁",
    scServer: "ln-r.toweraiot.cn", // 正常注册机域名
    vsrDomain: "ln.toweraiot.cn", // VSR域名
  },
  // 灾备服务器地址（带zb-前缀）
  {
    code: "LN-ZB",
    name: "辽宁(灾备)",
    scServer: "zb-ln-r.toweraiot.cn", // 灾备区注册机域名
    vsrDomain: "ln.toweraiot.cn", // VSR域名
  },
  {
    code: "HL",
    name: "黑龙江",
    scServer: "hl-r.toweraiot.cn",
    vsrDomain: "hl.toweraiot.cn",
  },
  {
    code: "HL-ZB",
    name: "黑龙江(灾备)",
    scServer: "zb-hl-r.toweraiot.cn",
    vsrDomain: "hl.toweraiot.cn",
  },
  {
    code: "SD",
    name: "山东",
    scServer: "sd-r.toweraiot.cn",
    vsrDomain: "sd.toweraiot.cn",
  },
  {
    code: "SD-ZB",
    name: "山东(灾备)",
    scServer: "zb-sd-r.toweraiot.cn",
    vsrDomain: "sd.toweraiot.cn",
  },
  {
    code: "SN",
    name: "陕西",
    scServer: "sn-r.toweraiot.cn",
    vsrDomain: "sn.toweraiot.cn",
  },
  {
    code: "SN-ZB",
    name: "陕西(灾备)",
    scServer: "zb-sn-r.toweraiot.cn",
    vsrDomain: "sn.toweraiot.cn",
  },
  {
    code: "FJ",
    name: "福建",
    scServer: "fj-r.toweraiot.cn",
    vsrDomain: "fj.toweraiot.cn",
  },
  {
    code: "FJ-ZB",
    name: "福建(灾备)",
    scServer: "zb-fj-r.toweraiot.cn",
    vsrDomain: "fj.toweraiot.cn",
  },
  {
    code: "HN",
    name: "湖南",
    scServer: "hn-r.toweraiot.cn",
    vsrDomain: "hn.toweraiot.cn",
  },
  {
    code: "HN-ZB",
    name: "湖南(灾备)",
    scServer: "zb-hn-r.toweraiot.cn",
    vsrDomain: "hn.toweraiot.cn",
  },
  {
    code: "GS",
    name: "甘肃",
    scServer: "gs-r.toweraiot.cn",
    vsrDomain: "gs.toweraiot.cn",
  },
  {
    code: "GS-ZB",
    name: "甘肃(灾备)",
    scServer: "zb-gs-r.toweraiot.cn",
    vsrDomain: "gs.toweraiot.cn",
  },
  {
    code: "YN",
    name: "云南",
    scServer: "yn-r.toweraiot.cn",
    vsrDomain: "yn.toweraiot.cn",
  },
  {
    code: "YN-ZB",
    name: "云南(灾备)",
    scServer: "zb-yn-r.toweraiot.cn",
    vsrDomain: "yn.toweraiot.cn",
  },
  {
    code: "XJ",
    name: "新疆",
    scServer: "xj-r.toweraiot.cn",
    vsrDomain: "xj.toweraiot.cn",
  },
  {
    code: "XJ-ZB",
    name: "新疆(灾备)",
    scServer: "zb-xj-r.toweraiot.cn",
    vsrDomain: "xj.toweraiot.cn",
  },
  {
    code: "XZ",
    name: "西藏",
    scServer: "xz-r.toweraiot.cn",
    vsrDomain: "xz.toweraiot.cn",
  },
  {
    code: "XZ-ZB",
    name: "西藏(灾备)",
    scServer: "zb-xz-r.toweraiot.cn",
    vsrDomain: "xz.toweraiot.cn",
  },
  {
    code: "ZJ",
    name: "浙江",
    scServer: "zj-r.toweraiot.cn",
    vsrDomain: "zj.toweraiot.cn",
  },
  {
    code: "ZJ-ZB",
    name: "浙江(灾备)",
    scServer: "zb-zj-r.toweraiot.cn",
    vsrDomain: "zj.toweraiot.cn",
  },
  {
    code: "HA",
    name: "河南",
    scServer: "ha-r.toweraiot.cn",
    vsrDomain: "ha.toweraiot.cn",
  },
  {
    code: "HA-ZB",
    name: "河南(灾备)",
    scServer: "zb-ha-r.toweraiot.cn",
    vsrDomain: "ha.toweraiot.cn",
  },
  {
    code: "HE",
    name: "河北",
    scServer: "he-r.toweraiot.cn",
    vsrDomain: "he.toweraiot.cn",
  },
  {
    code: "HE-ZB",
    name: "河北(灾备)",
    scServer: "zb-he-r.toweraiot.cn",
    vsrDomain: "he.toweraiot.cn",
  },
  {
    code: "SC",
    name: "四川",
    scServer: "sc-r.toweraiot.cn",
    vsrDomain: "sc.toweraiot.cn",
  },
  {
    code: "SC-ZB",
    name: "四川(灾备)",
    scServer: "zb-sc-r.toweraiot.cn",
    vsrDomain: "sc.toweraiot.cn",
  },
  {
    code: "GZ",
    name: "贵州",
    scServer: "gz-r.toweraiot.cn",
    vsrDomain: "gz.toweraiot.cn",
  },
  {
    code: "GZ-ZB",
    name: "贵州(灾备)",
    scServer: "zb-gz-r.toweraiot.cn",
    vsrDomain: "gz.toweraiot.cn",
  },
  {
    code: "JS",
    name: "江苏",
    scServer: "js-r.toweraiot.cn",
    vsrDomain: "js.toweraiot.cn",
  },
  {
    code: "JS-ZB",
    name: "江苏(灾备)",
    scServer: "zb-js-r.toweraiot.cn",
    vsrDomain: "js.toweraiot.cn",
  },
  {
    code: "HB",
    name: "湖北",
    scServer: "hb-r.toweraiot.cn",
    vsrDomain: "hb.toweraiot.cn",
  },
  {
    code: "HB-ZB",
    name: "湖北(灾备)",
    scServer: "zb-hb-r.toweraiot.cn",
    vsrDomain: "hb.toweraiot.cn",
  },
  {
    code: "AH",
    name: "安徽",
    scServer: "ah-r.toweraiot.cn",
    vsrDomain: "ah.toweraiot.cn",
  },
  {
    code: "AH-ZB",
    name: "安徽(灾备)",
    scServer: "zb-ah-r.toweraiot.cn",
    vsrDomain: "ah.toweraiot.cn",
  },
  {
    code: "GD",
    name: "广东",
    scServer: "gd-r.toweraiot.cn",
    vsrDomain: "gd.toweraiot.cn",
  },
  {
    code: "GD-ZB",
    name: "广东(灾备)",
    scServer: "zb-gd-r.toweraiot.cn",
    vsrDomain: "gd.toweraiot.cn",
  },
  {
    code: "GX",
    name: "广西",
    scServer: "gx-r.toweraiot.cn",
    vsrDomain: "gx.toweraiot.cn",
  },
  {
    code: "GX-ZB",
    name: "广西(灾备)",
    scServer: "zb-gx-r.toweraiot.cn",
    vsrDomain: "gx.toweraiot.cn",
  },
  {
    code: "BJ",
    name: "北京",
    scServer: "bj-r.toweraiot.cn",
    vsrDomain: "bj.toweraiot.cn",
  },
  {
    code: "BJ-ZB",
    name: "北京(灾备)",
    scServer: "zb-bj-r.toweraiot.cn",
    vsrDomain: "bj.toweraiot.cn",
  },
  {
    code: "TJ",
    name: "天津",
    scServer: "tj-r.toweraiot.cn",
    vsrDomain: "tj.toweraiot.cn",
  },
  {
    code: "TJ-ZB",
    name: "天津(灾备)",
    scServer: "zb-tj-r.toweraiot.cn",
    vsrDomain: "tj.toweraiot.cn",
  },
  {
    code: "SX",
    name: "山西",
    scServer: "sx-r.toweraiot.cn",
    vsrDomain: "sx.toweraiot.cn",
  },
  {
    code: "SX-ZB",
    name: "山西(灾备)",
    scServer: "zb-sx-r.toweraiot.cn",
    vsrDomain: "sx.toweraiot.cn",
  },
  {
    code: "NM",
    name: "内蒙古",
    scServer: "nm-r.toweraiot.cn",
    vsrDomain: "nm.toweraiot.cn",
  },
  {
    code: "NM-ZB",
    name: "内蒙古(灾备)",
    scServer: "zb-nm-r.toweraiot.cn",
    vsrDomain: "nm.toweraiot.cn",
  },
  {
    code: "JL",
    name: "吉林",
    scServer: "jl-r.toweraiot.cn",
    vsrDomain: "jl.toweraiot.cn",
  },
  {
    code: "JL-ZB",
    name: "吉林(灾备)",
    scServer: "zb-jl-r.toweraiot.cn",
    vsrDomain: "jl.toweraiot.cn",
  },
  {
    code: "SH",
    name: "上海",
    scServer: "sh-r.toweraiot.cn",
    vsrDomain: "sh.toweraiot.cn",
  },
  {
    code: "SH-ZB",
    name: "上海(灾备)",
    scServer: "zb-sh-r.toweraiot.cn",
    vsrDomain: "sh.toweraiot.cn",
  },
  {
    code: "JX",
    name: "江西",
    scServer: "jx-r.toweraiot.cn",
    vsrDomain: "jx.toweraiot.cn",
  },
  {
    code: "JX-ZB",
    name: "江西(灾备)",
    scServer: "zb-jx-r.toweraiot.cn",
    vsrDomain: "jx.toweraiot.cn",
  },
  {
    code: "HI",
    name: "海南",
    scServer: "hi-r.toweraiot.cn",
    vsrDomain: "hi.toweraiot.cn",
  },
  {
    code: "HI-ZB",
    name: "海南(灾备)",
    scServer: "zb-hi-r.toweraiot.cn",
    vsrDomain: "hi.toweraiot.cn",
  },
  {
    code: "CQ",
    name: "重庆",
    scServer: "cq-r.toweraiot.cn",
    vsrDomain: "cq.toweraiot.cn",
  },
  {
    code: "CQ-ZB",
    name: "重庆(灾备)",
    scServer: "zb-cq-r.toweraiot.cn",
    vsrDomain: "cq.toweraiot.cn",
  },
  {
    code: "QH",
    name: "青海",
    scServer: "qh-r.toweraiot.cn",
    vsrDomain: "qh.toweraiot.cn",
  },
  {
    code: "QH-ZB",
    name: "青海(灾备)",
    scServer: "zb-qh-r.toweraiot.cn",
    vsrDomain: "qh.toweraiot.cn",
  },
  {
    code: "NX",
    name: "宁夏",
    scServer: "nx-r.toweraiot.cn",
    vsrDomain: "nx.toweraiot.cn",
  },
  {
    code: "NX-ZB",
    name: "宁夏(灾备)",
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
