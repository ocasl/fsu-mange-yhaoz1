🔍-
100%
🔍+
⚊
◧
🌙
🔍
📋 Document Outline
No headings found

中国铁塔动环监控系统

统一互联 B 接口技术规范

（试行）

版本：V1.0

中国铁塔股份有限公司

2016 年 9 月

目录

1． 范围 4

2． 规范性引用文件 4

3． 定义 4

3.1 集中监控中心－Supervision Center（SC) 4

3.2 现场监控单元－Field supervision unit（FSU) 4

3.3 通信协议 —Communication Protocol 4

3.4 B 接口—B Interface 5

3.5 监控对象—Supervision Object(SO) 5

3.6 监控点—Supervision Point(SP) 5

3.7 数据流接口 5

4． 接口 5

5． B 接口互联规范 6

5.1 B 接口互联 6

5.2 B 接口报文协议 6

6． FTP 接口能力 42

7． FSU 初始化能力 43

8． FSU 自动升级能力 43

9． SC 心跳功能 43

10． 门限值配置 43

前 言

为加强中国铁塔动力环境集中监控系统（以下简称动环监控系统）建设，实现集团监控中心对全国铁塔动力设备和环境的统一监控、统一派单的目标，特制定中国铁塔动环监控系统统一互联 B 接口技术规范。本规范明确了动环监控系统互联 B 接口互联规范、B 接口定义、互联协议、报文协议及数据库协议。本规范作为动环监控系统的建设标准，同时也可作为接入中国铁塔动环监控系统平台的各动环厂家软、硬件技术设备的技术参考依据。

范围
B 接口规定了动环监控系统在监控中心（SC）与现场监控单元（FSU）互联的数据传输规范。

以上图中右侧单位称为“接出方”，左侧单位称为“接入方”。

规范性引用文件
下列文件对本文件的应用是必不可少的。凡是注日期的引用文件，仅注日期的版本适用于本文件。凡是不注日期的引用文件，其最新版本（包括所有的修改单）适用于本文件。

YDT1363.2-2014 通信局（站）电源、空调及环境集中监控监控管理系统 第 2 部分：互联协议

中国铁塔动环监控系统 统一编码及命名规范 V1.0

中国铁塔动环监控系统 统一信号字典表 V1.0

定义
下列术语和定义适用于本文件。

集中监控中心－Supervision Center（SC)
面向多 FSU 管理的高级监控层次，即集团监控平台，通过开放的数据协议，连接全国的 FSU。

现场监控单元－Field supervision unit（FSU)
监控系统的最小子系统，由若干监控模块和其它辅助设备组成，面向直接的设备数据采集、处理的监控层次，可以包含采样、数据处理、数据中继等功能。

通信协议 —Communication Protocol
规范两个实体之间进行标准通信的应用层的规约。

B 接口—B Interface
为集中监控中心（SC）与现场监控单元（FSU）之间的接口。

监控对象—Supervision Object(SO)
被监控的各种电源、空调设备及机房环境。

监控点—Supervision Point(SP)
监控对象上某个特定的监控信号。

数据流接口
一种基于 Soap+XML 技术的接口。

接口
依据管理功能的不同将整个监控系统划分为几个网络管理层，各个管理层之间存在着相互通信，而且整个监控监控管理系统存在与综合网管之间的相互通信，这样为保证网络内部不同级别的管理层之间正常通信、监控系统与综合网管的正常通信，将不同管理层之间定义不同的接口，接口定义如图 1 所示。

接口定义示意图
本互联接口指 B 接口，后面的描述简称为 B 接口。

B 接口互联规范
B 接口互联
接口方式
FSU 与 SC 之间通过 WebService 和 FTP 方式互联，二者同时形成完整的 B 接口协议标准。

接入双方要求
SC 轮询 FSU 获取数据(慢数据)：温湿度、电压、电流、电量、频率、开关状态等。此时 FSU 为服务端，SC 为客户端；

慢数据里的视频图像文件，采用 FTP 方式获取。此时 FSU 为 FTP 服务端，SC 为客户端；

FSU 主动上报设备事件数据（快数据）：告警、状态切换等。此时，FSU 为客户端，SC 为服务端。

B 接口报文协议
报文原则
SC 与 FSU 之间的接口基于 WebService 技术，消息协议采用 XML 格式。

WSDL 定义
SC 提供的 Webservice 接口的 WSDL 定义见附件

FSU 接口的 Webservice 接口的 WSDL 定义见附件

基本报文格式定义
基本报文格式定义
类型

一级节点

二级节点

定义

请求报文

Request

PK_Type

报文类型

Info

报文内容

响应报文

Response

PK_Type

报文类型

Info

报文内容

对象模型
在监控中心下的对象模型参考如下：

监控中心的对象模型
注：可根据实际情况，在监控中心和 FSU 间可以没有区域。

基本定义
当前告警：当前未结束的告警信息。
实时数据：最靠近当前时间的有效数据。
FSUID： 数字串 ID，从资源系统获取的唯一 ID。
FSU 编码：14 位字符串，编码方式如下：
FSU 编码借鉴中华人民共和国行政区划代码（GB/T 2260-2007)规范编码作为基础。将 FSU 做为一种设备管理，设备类型为 33。

FSU 编码：由 XX 省（2 位数字）+XX 区县（4 位数字）+局站类型与设备类型组合（3 位数字,设备类型固定为 33）+XXFSU（5 位数字）。

XX 省（2 位数字）+XX 区县（4 位数字）的编码建议借鉴中华人民共和国行政区划代码（GB/T 2260-2007)规范的代码，详见中华人民共和国行政区划代码（GB/T 2260-2007)规范）。

XXFSU 有 5 位数字，可以考虑自动生成，生成后不再变动；也可预先编好。同一个区县的局站编码不得重复。

局站类型编码表
局站类型编码

局站类型

0

特殊局站（自定义）

1

A 级局站

2

B 级局站

3

C 级局站

4

D 级局站

5~9

保留

比如，一个 A 类局站 FSU 名称为跑马场 FSU，可以编为 10001；一个 D 类局站 FSU 名称为牛头山 FSU，可以编为 40001。

设备 ID，从资源系统获取的设备唯一 ID。
设备编码
设备编码：设备编码借鉴中华人民共和国行政区划代码（GB/T 2260-2007)规范编码作为基础。FSU 编码：由 XX 省（2 位数字）+XX 区县（4 位数字）+局站类型与设备类型组合（3 位数字）+XX 设备（5 位数字）。

XX 省（2 位数字）+XX 区县（4 位数字）的编码建议借鉴中华人民共和国行政区划代码（GB/T 2260-2007)规范的代码，详见中华人民共和国行政区划代码（GB/T 2260-2007)规范）。XX 设备有 5 位数字，可以考虑自动生成，生成后不再变动；也可预先编好。同一个区县的设备编码不得重复。

监控点 ID：设备上的监测点的 ID，10 位数字。监控点在 FSU 内的标识号唯一。
信号 ID 共 10 位，按照从低位到高位的顺序，具体定义如下：【0987654321】

1-3：同类信号的顺序号，如整流模块、单体电池序号、输入电压路序号、负载熔丝序号、压缩机序号等，参考【信号字典表】

4-5：设备中具体信号的流水号，从 00 至 99。(各省自行增加的信号请从 70 开始开始往上定义）

6： 0-遥信信号（DI），1-遥测信号（AI），2-遥控信号（DO），3-遥调信号（AO）

7-8：设备类型：详见设备/系统类型编码表

9: 局站类型：详见局站类型编码表

10: 预留扩展，暂固定为 0

具体可参见《中国铁塔动环监控系统 统一信号字典表》中信号量 ID 的定义。

告警事件描述采用 XML 文件，XML 格式如下：
<TAlarm>

<SerialNo>告警序号</SerialNo>

<DeviceId>设备 ID</DeviceId>

<DeviceCode>设备 ID</DeviceCode >

<AlarmTime>告警时间</AlarmTime>

<FsuId>FSUID</FsuId>

<FsuCode>FSUID</ FsuCode>

<Id>监控点 ID</Id>

<AlarmLevel>告警级别</AlarmLevel>

<AlarmFlag>告警标志</AlarmFlag>

<AlarmDesc>告警文本</AlarmDesc>

</TAlarm>

告警序号：以 10 位数字表示，如 0012345678(十进制)，不足 10 位前面补 0，最大不能超过一个无符号长整型所表示的数字，即数字在 0~4294967295 之间。同时在 FSC 内告警序号唯一，告警结束时的告警序号与告警产生时的告警序号相同。
设备 ID：参考设备 ID 编码。
时间描述：YYYY-MM-DD<SPACE 键>hh:mm:ss（采用 24 小时的时间制式）。
FSU ID：11 位字符串表示。
监控点 ID：参考监控点 ID。
告警级别：一级/二级/三级/四级。
告警标志描述：开始/结束。
告警文本：40 字节以内的告警内容描述。
例：

<TAlarm>

<SerialNo>0012345678</SerialNo>

<DeviceID>11010110100001</DeviceID>

<DeviceCode>11010110100001</DeviceCode>

<AlarmTime>2006-09-04 12:01:31</AlarmTime>

<FsuId>10024</FsuId>

<FsuCode>11010110100001</FsuCode>

<Id>0430101001</Id>

<AlarmLevel>二级</AlarmLevel>

<AlarmFlag>开始</AlarmFlag>

<AlarmDesc>欠压告警(46.1V)</AlarmDesc>

</TAlarm>

说明：例中 46.1V 为告警触发值，其中<(符>、<)符>为半角符号。对于遥信量告警，告警文本为“告警”、“熔断”等文字。

所有文本描述中不能包含”<符” 、”>符”字符。
数据类型的字节数定义
数据类型字节数定义
类型

字节数

Long

4 字节

Short

2 字节

Char

1 字节

Float

4 字节

枚举类型

4 字节

FSU 向 SC 注册的信息：
IPSec/L2TP 拨号参数：FSU 向 IPSec/L2TP 服务器建立 IPSec/L2TP 隧道所须参数，包括 IPSec/L2TP 服务器 IP、用户名、密码；
SC IP：SC 前置机或采集机的 IP，FSU 向其发起注册和工作过程中数据交互的目的 IP。
SC、FSU 根据下图所示，建立连接：
FSU 客户端

SC 服务端

LOGIN

LOGIN_ACK

注册过程

登出过程

LOGOUT

LOGOUT_ACK

返回注册确认

返回登出过程是否成功

Setup TCP link（1、4G/3G 拨号；2、IPSec 拨号，分配内网 IP）

Login success

Break out TCP link

工作过程

连接建立过程
WebService 接口采用 http+soap+xml 的方式，工作过程如下：

建立 IPSec/L2TP 隧道连接：FSU 客户端先进行 4G/3G 拨号上网，成功后向 IPSec/L2TP 服务器进行 IPSec/L2TP 拨号，建立 IPSec/L2TP 隧道，获取内网 IP。
建立 IPSec/L2TP 隧道连接成功后，FSU 向 SC 传送 login , login_ack 报文；报文使用的用户名必须为 SC 服务端提供给 FSU 客户端的合法用户名，并且报文必须携带在第一步所获得的内网 IP、FSU 能力（即 FSU 所接设备的设备 ID 列表），由服务端进行认证。
如果登录成功，则 B 接口协议通过这个连接通讯。
当 FSU 与 SC 之间的连接意外中断后，FSU 必须重新进行上述连接和注册过程。
当 logout , logout_ack 报文在此 IPSec/L2TP 隧道连接上传送，成功登出之后，FSU 客户端主动拆除 IPSec/L2TP 隧道连接。
数据流方式
FSU 向 SC 注册
客户端向服务端传送用户名、口令、内网 IP；服务端向客户端发送注册确认。同一个 FSU 两次注册之间的最小时间间隔不小于 180 秒。

FSU 客户端

SC 服务端

LOGIN

LOGIN_ACK

FSU 注册过程

SC 登出过程

LOGOUT

LOGOUT_ACK

注册成功后，可以进行数据交流

返回注册确认

返回登出过程是否成功

用户注册过程
上报告警信息
FSU 做客户端，SC 是服务端。FSU 根据告警门限判断有告警需上报时，向 SC 上报告警信息，SC 返回确认信息。

SC 服务端

FSU 客户端

上报告警信息

SEND_ALARM

SEND_ALARM_ACK

接收到告警返回

用户请求告警数据过程
用户请求监控点数据
客户端向服务端发送所需数据的标识，服务端向客户端发送客户要求的监控点的当前状态信息。

SC 客户端

FSU 服务端

GET_DATA

GET_DATA_ACK

FSU 返还数据

用户请求数据

用户请求监控点数据过程
用户请求监控点历史数据
客户端向服务端发送所需数据的标识，服务端向客户端发送客户要求的时间段内的监控点的历史状态信息，按轮询周期（1 小时），一个轮询周期只取 1 个点。

SC 客户端

FSU 服务端

GET_HISDATA

GET_HISDATA_ACK

FSU 返还数据

用户请求数据

用户请求监控点历史数据过程
用户请求写监控点的设置值
客户端向服务端发送监控点的标识 ID 和新设置值，服务端设置监控点的新设置值并向客户端返回成功与否。

SC 客户端

FSU 服务端

SET_POINT

SET_POINT_ACK

设置数据值

返回设置成功与否标记

用户请求写监控点的设置值过程
用户请求监控点门限数据
客户端向服务端发送所需数据的标识，服务端向客户端发送客户要求的监控点的门限数据。

SC 客户端

FSU 服务端

GET_THRESHOLD

GET_THRESHOLD_ACK

FSU 返还数据

用户请求数据

用户请求监控点门限数据
用户请求写监控点门限数据
客户端向服务端发送监控点的标识 ID 和新门限数据，服务端设置监控点的新门限数据并向客户端返回成功与否。

SC 客户端

FSU 服务端

SET_THRESHOLD

SET_THRESHOLD_ACK

设置门限数据

返回设置成功与否标记

用户请求写监控点门限数据
用户获取 FSU 的注册数据
客户端向服务端发送获取 FSU 向 SC 注册的数据（IPSec/L2TP 用户、密码、IPSec/L2TP 服务器 IP、SC IP、DeviceID 列表）的信息，服务端返回注册数据。

SC 客户端

FSU 服务端

GET_LOGININFO

GET\_ LOGININFO_ACK

发起获取要求

返回获取成功与否

获取注册数据过程
用户设置 FSU 的注册数据
客户端向服务端发送设置 FSU 向 SC 注册的数据（IPSec/L2TP 用户、密码、IPSec/L2TP 服务器 IP、SC IP）的信息，服务端存储注册数据并返还成功标志。

SC 客户端

FSU 服务端

SET_LOGININFO

SET_LOGININFO_ACK

发起设置要求

返回设置成功与否

设置注册数据过程
用户获取 FSU 的 FTP 数据
客户端向服务端发送获取 FTP 用户、密码、数据的信息，服务端返回 FTP 数据。

SC 客户端

FSU 服务端

GET_FTP

GET\_ FTP \_ACK

发起获取要求

返回获取成功与否

获取 FTP 数据过程
用户设置 FSU 的 FTP 数据
客户端向服务端发送设置 FTP 用户、密码数据的信息，服务端存储 FTP 数据并返还成功标志。

SC 客户端

FSU 服务端

SET\_ FTP

SET\_ FTP \_ACK

发起设置要求

返回设置成功与否

设置 FTP 数据过程
时间同步
客户端向服务端发送标准时间信息，该信息在客户端启动与服务端连接时发送，也可以进行手动发送，FSU 服务端按参数更新时间并返回成功标志。

SC 客户端

FSU 服务端

TIME_CHECK

TIME_CHECK_ACK

发起对时要求

返回对时成功与否

时间同步过程
用户获取 FSU 信息
客户端向服务端发送获取 FSU 信息的要求，服务端返回当前 FSU 状态参数。

SC 客户端

FSU 服务端

GET_FSUINFO

GET_FSUINFO_ACK

发起获取要求

返回 FSU 状态参数

获取 FSU 信息过程
用户重启 FSU
客户端向服务端发送重启要求，服务端返回成功标志后重启。（此报文用于 FSU 的升级等操作：SC 侧先通过 FTP 将升级文件上传到 FSU 根目录，再发此报文使 FSU 重启后自动升级）。

SC 客户端

FSU 服务端

SET_FSUREBOOT

SET_FSUREBOOT_ACK

发起重启要求

返回确认

重启 FSU 过程
常量定义
常量定义
NAME_LENGTH

名字命名长度

40 字节

USER_LENGTH

用户名长度

20 字节

PASSWORD_LEN

口令长度

20 字节

EVENT_LENGTH

事件信息长度

160 字节

ALARM_LENGTH

告警事件信息长度

165 字节

LOGIN_LENGTH

登录事件信息长度

100 字节

DES_LENGTH

描述信息长度

40 字节

UNIT_LENGTH

数据单位的长度

8 字节

STATE_LENGTH

态值描述长度

160 字节

VER_LENGTH

版本描述的长度

20 字节

AREACODE_LENGTH

区域编码长度

7 字节

STATIONCODE_LENGTH

机房编码长度

12 字节

NODECODE_LENGTH

监控信号编码

11 字节

EVENT_LENGTH

事件信息长度

160 字节

FSUID_LEN

FSU ID 字符串长度

14 字节

FSUCODE_LEN

FSU 编码字符串长度

14 字节

IP_LENGTH

IP 串长度

15 字节

MAC_LENGTH

MAC 串长度

15 字节

IMSI_LENGTH

IMSI 卡号长度

15 字节

NETWORKTYPE_LENGTH

网络制式长度

2 字节

CARRIER_LENGTH

运营商长度

2 字节

NMVENDOR_LENGTH

上网模块厂商

20 字节

NMTYPE_LENGTH

上网模块型号

20 字节

REG_MODE_LENGTH

注册模式长度

2 字节

DEVICEID_LEN

设备 ID 长度

14 字节

DEVICECODE_LEN

设备编码

14 字节

ID_LENGTH

监控点 ID 长度

10 字节

SERIALNO_LEN

告警序号长度

10 字节

TIME_LEN

时间串长度

19 字节

FSUVENDOR_LENGTH

FSU 厂商长度

20 字节

FSUTYPE_LENGTH

FSU 型号长度

20 字节

VERSION_LENGTH

版本串长度

20 字节

DICTVERSION_LENGTH

信号字典版本长度

1 字节

枚举定义 1.枚举定义
属性名称

属性描述

枚举类型

类型定义

EnumRightMode

监控系统 FSU 向 SC 提供的权限定义

INVALID ＝ 0

无权限

LEVEL1 ＝ 1

具备数据读的权限,当用户可以读某个数据，而无法写任何数据时返回这一权限值。

LEVEL2 ＝ 2

具备数据读、写的权限，当用户对某个数据具有读写权限时返回这一权限值。

EnumResult

报文返回结果

FAILURE ＝ 0

失败

SUCCESS ＝ 1

成功

EnumType

监控系统数据的种类

STATION ＝ 0

局、站

DEVICE ＝ 1

设备

DI ＝ 2

数字输入量（包含多态数字输入量）

AI ＝ 3

模拟输入量

DO ＝ 4

数字输出量

AO ＝ 5

模拟输出量

AREA ＝ 9

区域

EnumAlarmLevel

告警的等级

NOALARM ＝ 0

无告警

CRITICAL ＝ 1

一级告警

MAJOR ＝ 2

二级告警

MINOR ＝ 3

三级告警

HINT ＝ 4

四级告警

EnumEnable

使能的属性

DISABLE ＝ 0

禁止/不能

ENABLE ＝ 1

开放/能

EnumAcceSCMode

实时数据访问的方式

ASK_ANSWER ＝ 0

一问一答方式

CHANGE_TRIGGER ＝ 1

改变时自动发送数据方式

TIME_TRIGGER ＝ 2

定时发送数据方式

STOP ＝ 3

停止发送数据方式

EnumState

数据值的状态

NOALARM ＝ 0

正常数据

CRITICAL ＝ 1

一级告警

MAJOR ＝ 2

二级告警

MINOR ＝ 3

三级告警

HINT ＝ 4

四级告警

OPEVENT ＝ 5

操作事件

INVALID ＝ 6

无效数据

EnumFlag

告警标志

BEGIN

开始

END

结束

EnumAlarmMode

告警等级设定的模式

NOALARM ＝ 0

不做告警上报

CRITICAL ＝ 1

一级告警上报

MAJOR ＝ 2

二级告警上报

MINOR ＝ 3

三级告警上报

HINT ＝ 4

四级告警上报

EnumStationType

局站类型

0

特殊机房（自定义）

1

A 级机房

2

B 级机房

3

C 级机房

4

D 级机房

5

保留

6

保留

7

保留

8

保留

9

保留

EnumModifyType

对象属性修改类型

ADDNONODES=0

新增（无子节点）

ADDINNODES=1

新增（含子节点）

DELETE=2

删除

MODIFYNONODES=3

修改（仅修改本节点）

MODIFYINNODES=4

修改（涉及到子节点）

EnumDeviceType

设备类型

1

高压配电

2

低压配电

3

交流配电屏

4

直流配电屏

5

柴油发电机组

6

开关电源

7

蓄电池组

8

UPS 设备

9

UPS 配电屏

10

UPS 电池

11

240V 直流系统

12

专用空调(风冷)

13

中央空调(水冷)

14

专用空调（通冷冻水型）

15

普通空调

16

智能电表（交流）

17

门禁系统

18

机房/基站环境

19

监控设备

20

新能源供电系统（太阳能、风能）

21

燃气轮机发电机组

22

风力发电设备

23

智能通风系统

24

新风设备

25

热交换设备

26

热管设备

27

蓄电池温控柜

28

防雷设备/防雷箱

29

燃料电池

30

模块化 UPS

31

240V 电池

32

铁锂电池

33

逆变器

34

280V 直流远供系统-局端升压

35

280V 直流远供系统-远端降压

36

智能电表（直流）

37

铁塔

38

智能动环监控设备（FSU）

39~99

预留

EnumDeviceCode

设备编码

见设备编码表

见设备编码表

2.设备编码表

设备/系统类型序号

设备/系统类型

设备编码（EnumDeviceCode）

A 类局站

B 类局站

C 类局站

D 类局站

1

高压配电

101

201

301

401

2

低压配电

102

202

302

402

3

交流配电屏

103

203

303

403

4

直流配电屏

104

204

304

404

5

柴油发电机组

105

205

305

405

6

开关电源

106

206

306

406

7

蓄电池组

107

207

307

407

8

UPS 设备

108

208

308

408

9

UPS 配电屏

109

209

309

409

10

UPS 电池

110

210

310

410

11

240V 直流系统

111

211

311

411

12

专用空调(风冷)

112

212

312

412

13

中央空调(水冷)

113

213

313

413

14

专用空调（通冷冻水型）

114

214

314

414

15

普通空调

115

215

315

415

16

智能电表（交流）

116

216

316

416

17

门禁系统

117

217

317

417

18

机房/基站环境

118

218

318

418

19

监控设备

119

219

319

419

20

新能源供电系统（太阳能、风能）

120

220

320

420

21

燃气轮机发电机组

121

221

321

421

22

风力发电设备

122

222

322

422

23

智能通风系统

123

223

323

423

24

新风设备

124

224

324

424

25

热交换设备

125

225

325

425

26

热管设备

126

226

326

426

27

蓄电池温控柜

127

227

327

427

28

防雷设备/防雷箱

128

228

328

428

29

燃料电池

129

229

329

429

30

模块化 UPS

130

230

330

430

31

240V 电池

131

231

331

431

32

铁锂电池

132

232

332

432

33

逆变器

133

233

333

433

34

280V 直流远供系统-局端升压

134

234

334

434

35

280V 直流远供系统-远端降压

135

235

335

435

36

智能电表（直流）

136

236

336

436

37

铁塔

137

237

337

437

38

智能动环监控设备（FSU）

138

238

338

438

39

室外配电设备

139

239

229

439

40~98

预留









99

非智能门禁

199

299

399

499

数据结构定义
数据结构定义
结构名称

结构描述

属性名称

属性类型

类型定义

TTime

时间的结构

Years

short

年

Month

char

月

Day

char

日

Hour

char

时

Minute

char

分

Second

char

秒

TSemaphore

信号量的值的结构

Type

EnumType

数据类型

ID

char[ID_LENGTH]

监控点 ID

MeasuredVal

float

实测值

SetupVal

float

设置值

Status

EnumState

状态

RecordTime

char [DES_LENGTH]

记录时间，YYYY-MM-DD<SPACE 键>hh:mm:ss（采用 24 小时的时间制式），取历史数据时的记录时间

TThreshold

信号量的门限值的结构

Type

EnumType

数据类型

ID

char[ID_LENGTH]

监控点 ID

Threshold

float

门限值

AbsoluteVal

float

绝对阀值

RelativeVal

float

百分比阀值

Status

EnumState

状态

TAlarm

当前告警值的结构

SerialNo

char[SERIALNO_LEN]

告警序号

ID

char[ID_LENGTH]

监控点 ID

FSUID

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

DeviceID

char[DEVICEID_LEN]

设备 ID

DeviceCode

char[DEVICEICODE_LEN]

设备编码

AlarmTime

char [DES_LENGTH]

告警时间，YYYY-MM-DD<SPACE 键>hh:mm:ss（采用 24 小时的时间制式）

AlarmLevel

EnumState

告警级别

AlarmFlag

EnumFlag

告警标志

AlarmDesc

char [DES_LENGTH]

告警的事件描述

TGPS

GPS 数据结构

FSUID

long

FSU ID

Lag

float

经度

Lat

float

纬度

TFSUStatus

FSU 状态参数

CPUUsage

float

CPU 使用率

MEMUsage

float

内存使用率

报文类型定义
报文类型定义
报文类型

报文动作

数据流方向

类型名称

类型代号

FSU 向 SC 注册

注册

SC<—FSU

LOGIN

101

注册响应

SC—>FSU

LOGIN_ACK

102

登出

SC<—FSU

LOGOUT

103

登出响应

SC—>FSU

LOGOUT_ACK

104

用户请求监控点数据

用户请求监控点数据

SC—>FSU

GET_DATA

401

用户请求监控点数据响应

SC<—FSU

GET_DATA_ACK

402

用户请求监控点历史数据

SC—>FSU

GET_HISDATA

403

用户请求监控点历史数据响应

SC—>FSU

GET_HISDATA_ACK

404

上报告警信息

实时告警发送

SC<—FSU

SEND_ALARM

501

实时告警发送确认

SC—>FSU

SEND_ALARM_ACK

502

用户请求写监控点的设置值

写数据请求

SC—>FSU

SET_POINT

1001

写数据响应

SC<—FSU

SET_POINT_ACK

1002

时钟同步

发送时钟消息

SC—>FSU

TIME_CHECK

1301

时钟同步响应

SC<—FSU

TIME_CHECK_ACK

1302

用户获取 FSU 的注册信息

获取注册信息（IPSec 用户、密码、IPSec 服务器 IP、SC IP 数据）

SC—>FSU

GET_LOGININFO

1501

获取注册信息（IPSec 用户、密码、IPSec 服务器 IP、SC IP 数据）响应

SC<—FSU

GET_LOGININFO_ACK

1502

用户设置 FSU 的注册信息

设置注册信息（IPSec 用户、密码、IPSec 服务器 IP、SC IP 数据）

SC—>FSU

SET_LOGININFO

1503

设置注册信息（IPSec 用户、密码、IPSec 服务器 IP、SC IP 数据）响应

SC<—FSU

SET_LOGININFO_ACK

1504

用户获取 FSU 的 FTP 数据

获取 FSU 的 FTP 用户、密码数据

SC—>FSU

GET_FTP

1601

获取 FSU 的 FTP 用户、密码数据响应

SC<—FSU

GET_FTP_ACK

1602

用户设置 FSU 的 FTP 数据

设置 FSU 的 FTP 用户、密码数据

SC—>FSU

SET_FTP

1603

设置 FSU 的 FTP 用户、密码数据响应

SC<—FSU

SET_FTP_ACK

1604

用户获取 FSU 的信息

获取 FSU 的状态参数

SC—>FSU

GET_FSUINFO

1701

获取 FSU 的状态参数响应

SC<—FSU

GET_FSUINFO_ACK

1702

用户重启 FSU

重启 FSU

SC—>FSU

SET_FSUREBOOT

1801

重启 FSU 响应

SC<—FSU

SET_FSUREBOOT_ACK

1802

用户请求监控点门限数据

用户请求监控点门限数据

SC—>FSU

GET_THRESHOLD

1901

用户请求监控点门限数据响应

SC<—FSU

GET_THRESHOLD_ACK

1902

用户请求写监控点门限数据

用户请求写监控点门限数据请求

SC—>FSU

SET_THRESHOLD

2001

用户请求写监控点门限数据响应

SC<—FSU

SET_THRESHOLD_ACK

2002

数据流格式定义
FSU 向 SC 注册
动作：注册

发起：客户端

FSU 向 SC 注册请求报文
发起

客户端

字段

变量名称/报文定义

长度及类型

描述

PK_Type

LOGIN

Sizeof(long)

登录命令

上网模块型号 Info

UserName

USER_LENGTH

用户名：预留，上报空字段

PaSCword

PASSWORD_LEN

口令：预留，上报空字段

FsuId

char[FSUID_LEN]

FS ID 号，资源系统的 ID

FsuCode

char[FSUID_LEN]

FSU 编码

FsuIP

IP_LENGTH

FSU 的内网 IP

MacId

MAC_LENGTH

无线模块的 MAC 地址（唯一标识）

ImsiId

IMSI_LENGTH

IMSI 卡号

NetworkType

NETWORK_TYPE_LENGTH

当前网络制式（2G、3G、4G）

LockedNetworkType

NETWORK_TYPE_LENGTH

已锁定网络制式

AUTO（自动注册网络）

GSM（联通/移动 2G）

CDMA（电信 2G）

WCDMA（联通 3G）

TDSCDMA（移动 3G）

EVDO（电信 3G）

LTE（移动/联通/电信 4G）

GSM_TDSCDMA（移动 2G/3G）

GSM_WCDMA（联通 2G/3G）

CDMA_EVDO（电信 2G/3G）

Carrier

CARRIER_LENGTH

运营商名称(枚举值，CT：电信，CM：移动，CU：联通)

NMVendor

NMVENDOR_LENGTH

上网模块厂商名称

中交信达

中兴物联

烽火通信

瑞莱普

基思瑞

大唐

邦讯

华为

中兴（倚天）

通鼎

宏电

艾默生

高新兴

NMType

NMTYPE_LENGTH

上网模块型号

Reg_Mode

REG_MODE_LENGTH

注册模式（枚举值，1：原有注册模块，2：新的注册械），可为空，为空表示采用原有的注册模式，参考注册模式

FSUVendor

FSUVENDOR_LENGTH

FSU 的厂家名称

SJRE（瑞祺皓迪）

AMS（艾默生）

TDYY（通鼎义益）

ZXLW（中兴力维）

HW（华为）

DLY（动力源）

GXX（高新兴）

CLDZ（创力电子）

JSYAAO（江苏亚奥）

BONSONINFO（广州邦讯）

SZHAINENG（深圳海能）

SAIERCOM（西安赛尔）

DELTA（中达电通）

CDSF（成都四方）

KDCT（康大诚泰）

BDTH（保定天河）

SZYB（苏州云博）

DTYD（大唐移动）

ZJDH（浙江大华）

FSUType

FSUTYPE_LENGTH

FSU 的型号

FSUClass

FSUCLASS_LENGTH

FSU 的应用类型（枚举值）：

INTSTAN（标准一体化）

DISSTAN（标准分体式）

IHIEXTER（I 型高压室外式）

IIHIEXTER（II 型高压室外式）

ILOEXTER（I 型低压室外式）

IILOEXTER（II 型低压室外式）

Version

VERSION_LENGTH

FSU 的软件版本

DictVersion

DICTVERSION_LENGTH

信号量字典版本（枚举值，1：标准版，适用 3/4G 信号的基站；2：精减版，适用 2G 信号的基站）

DeviceList

n\*DEVICEID_LEN

DeviceID 列表

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>LOGIN</Name>

<Code>101</Code>

</PK_Type>

<Info>

<UserName>cntower</UserName>

<PaSCword>cntower</PaSCword>

<FsuId/>

<FsuCode/>

<FsuIP/>

<MacId/>

<ImsiId/>

<NetworkType/>

<LockedNetworkType/>

<Carrier/>

<NMVendor/>

<NMType/>

<Reg_Mode/>

<FSUVendor/>

<FSUType/>

<FSUClass/>

<Vervion/>

<DictVersion/>

<DeviceList>

<Device Id="" Code=""/>

<Device Id="" Code=""/>

<Device Id="" Code=""/>

</DeviceList>

</Info>

</Request>

响应：服务端

FSU 向 SC 注册请求应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

LOGIN_ACK

Sizeof(long)

登录命令相应

Info

RightLevel

EnumRightMode

发回权限设置

SCIP

IP_LENGTH

返回采集机 IP

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>LOGIN_ACK</Name>

<Code>102</Code>

</PK_Type>

<Info>

<SCIP/>

<RightLevel/>

</Info>

</Response>

动作：登出

发起：客户端

FSU 向 SC 登出请求报文
变量名称/报文定义

长度及类型

描述

PK_Type

LOGOUT

Sizeof(long)

登出命令

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>LOGOUT</Name>

<Code>103</Code>

</PK_Type>

<Info/>

</Request>

响应：服务端

FSU 向 SC 登出请求应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

LOGOUT_ACK

Sizeof(long)

登出命令回应

Info

Result

EnumResult

登出成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>LOGOUT_ACK</Name>

<Code>104</Code>

</PK_Type>

<Info>

<Result/>

</Info>

</Response>

上报告警信息
发起：客户端

上报告警信息报文
变量名称/报文定义

长度及类型

描述

PK_Type

SEND_ALARM

Sizeof(long)

告警上报

Values

TAlarm

告警信息

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>SEND_ALARM</Name>

<Code>501</Code>

</PK_Type>

<Info>

<Values>

<TAlarmList>

<TAlarm>

<SerialNo/>

<Id/>

<FsuId/>

<FsuCode/>

<DeviceId/>

<DeviceCode/>

<AlarmTime/>

<AlarmLevel/>

<AlarmFlag/>

<AlarmDesc/>

</TAlarm>

<TAlarm>

<SerialNo/>

<Id/>

<FsuId/>

<FsuCode/>

<DeviceId/>

<DeviceCode/>

<AlarmTime/>

<AlarmLevel/>

<AlarmFlag/>

<AlarmDesc/>

</TAlarm>

</TAlarmList>

</Values>

</Info>

</Request>

响应：服务端

上报告警信息应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

SEND_ALARM_ACK

Sizeof(long)

告警信息

Result

EnumResult

返回设置结果

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SEND_ALARM_ACK</Name>

<Code>502</Code>

</PK_Type>

<Info>

<Result/>

</Info>

</Response>

用户请求监控点数据
发起：客户端

用户请求监控点数据报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_DATA

Sizeof(long)

用户请求监控点数据

Info

FsuId

char[FSUCODE_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Device

ID

char[DEVICEID_LEN]

资源系统的设备 ID

Code

char[DEVICECODE_LEN]

设备编码。当为全 9 时（即“99999999999999”），则返回该 FSU 所监控的所有设备的监控点的值；这种情况下，忽略 IDs 参数（即监控点 ID 列表）。

IDs

n\*ID_LENGTH

相应的监控点 ID 号。当为全 9 时（即“9999999999”），则返回该设备的所有监控点的值。

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_DATA</Name>

<Code>401</Code>

</PK_Type>

<Info>

<FsuID/>

<FsuCode/>

<DeviceList>

<Device Id=” 000000000001” Code="000000000001">

<Id/>

<Id/>

<Id/>

</Device>

<Device Id=” 000000000002” Code="000000000002">

<Id/>

<Id/>

<Id/>

</Device>

</DeviceList>

</Info>

</Request>

响应：服务端

用户请求监控点数据应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_DATA_ACK

Sizeof(long)

用户请求监控点数据响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

请求数据成功与否的标志

Values

Sizeof(TSemaphore)

对应 5.2.8 中的 TSemaphore 的数据结构定义

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_DATA_ACK</Name>

<Code>402</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

<Values>

<DeviceList>

<Device Id="000000000001" Code=” 000000000001”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

</Device>

<Device Id="000000000002" Code=” 000000000002”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

</Device>

</DeviceList>

</Values>

</Info>

</Response>

用户请求监控点历史数据
发起：客户端

用户请求监控点数据报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_HISDATA

Sizeof(long)

用户请求监控点数据

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

StartTime

char[TIME_LEN]

开始时间

EndTime

char[TIME_LEN]

结束时间

Device

ID

char[DEVICEID_LEN]

资源系统的 ID

CODE

char[DEVICECODE_LEN]

设备 ID。当为全 9 时（即“99999999999999”），则返回该 FSU 所监控的所有设备的监控点的值；这种情况下，忽略 IDs 参数（即监控点 ID 列表）。

IDs

n\*ID_LENGTH

相应的监控点 ID 号。当为全 9 时（即“9999999999”），则返回该设备的所有监控点的值。

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_HISDATA</Name>

<Code>403</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<StartTime/>

<EndTime/>

<DeviceList>

<Device Id="000000000001" Code=”000000000001”>

<Id/>

<Id/>

<Id/>

</Device>

<Device Id="000000000002" Code=”000000000002”>

<Id/>

<Id/>

<Id/>

</Device>

</DeviceList>

</Info>

</Request>

响应：服务端

用户请求监控点数据应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_HISDATA_ACK

Sizeof(long)

用户请求监控点数据响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

请求数据成功与否的标志

Values

Sizeof(TSemaphore)

对应 5.2.8 中的 TSemaphore 的数据结构定义

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_HISDATA_ACK</Name>

<Code>404</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

<Values>

<DeviceList>

<Device Id="000000000001" Code=” 000000000001”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status="" RecordTime=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status="" RecordTime=""/>

</Device>

<Device Id="000000000002" Code=” 000000000002”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status="" RecordTime=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status="" RecordTime=""/>

</Device>

</DeviceList>

</Values>

</Info>

</Response>

用户请求写监控点的设置值
发起：客户端

用户请求写监控点的设置值报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_POINT

Sizeof(long)

用户请求写监控点的设置值

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FsuCode_LEN]

FSU 编码

n\*Device

n\*char[DEVICECODE_LEN]

n 个设备的列表

m\*Value

m\*Sizeof(TSemaphore)

m 个监控点的设置值，数据的值的类型由相应的数据结构决定

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>SET_POINT</Name>

<Code>1001</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Value>

<DeviceList>

<Device Id="000000000001" Code = “000000000001”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

</Device>

<Device Id="000000000002" Code=” 000000000002”>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

<TSemaphore Type="" Id="" MeasuredVal="" SetupVal="" Status=""/>

</Device>

</DeviceList>

</Value>

</Info>

</Request>

响应：服务端

用户请求写监控点的设置值应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_POINT_ACK

Sizeof(long)

用户请求写监控点的设置值回应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FsuCode_LEN]

FSU 编码

n\*Device

n\*char[DEVICECODE_LEN]

n 个设备的列表

m\*Id

m\*Sizeof(long)

m 个控制或调节成功的 ID 的列表

t\*Id

t\*Sizeof(long)

t 个控制或调节失败的 ID 的列表

Result

EnumResult

写成功/失败（即控制的结果）

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SET_POINT_ACK</Name>

<Code>1002</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

<DeviceList>

<Device Id="000000000001" Code=” 000000000001”>

<SuccessList>

<Id/>

<Id/>

</SuccessList>

<FailList>

<Id/>

<Id/>

</FailList>

</Device>

<Device Id="000000000002" Code=” 000000000002”>

<SuccessList>

<Id/>

<Id/>

</SuccessList>

<FailList>

<Id/>

<Id/>

</FailList>

</Device>

</DeviceList>

</Info>

</Response>

用户请求监控点门限数据
发起：客户端

用户请求监控点门限数据报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_THRESHOLD

Sizeof(long)

用户请求监控点门限数据

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Device

ID

char[DEVICEID_LEN]

资源系统的 ID

Code

char[DEVICECODE_LEN]

设备 ID。当为全 9 时（即“99999999999999”），则返回该 FSU 所监控的所有设备的监控点门限数据，这种情况下，忽略 IDs 参数（即监控点 ID 列表）。

IDs

n\*ID_LENGTH

相应的监控点 ID 号。当为全 9 时（即“9999999999”），则返回该设备的所有监控点的门限数据。

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_THRESHOLD</Name>

<Code>1901</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<DeviceList>

<Device Id="000000000001" Code=”000000000001”>

<Id/>

<Id/>

<Id/>

</Device>

<Device Id="000000000002" Code=”000000000002”>

<Id/>

<Id/>

<Id/>

</Device>

</DeviceList>

</Info>

</Request>

响应：服务端

用户请求监控点门限数据应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_THRESHOLD_ACK

Sizeof(long)

用户请求监控点门限数据响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

请求数据成功与否的标志

Values

Sizeof(TThreshold)

对应 5.2.8 中的 TThreshold 的数据结构定义

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_THRESHOLD_ACK</Name>

<Code>1902</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

<Values>

<DeviceList>

<Device Id="000000000001" Code=”000000000001”>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

</Device>

<Device Id="000000000002" Code=”000000000002”>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

</Device>

</DeviceList>

</Values>

</Info>

</Response>

用户请求写监控点门限数据
发起：客户端

用户请求写监控点门限数据报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_THRESHOLD

Sizeof(long)

用户请求写监控点门限数据请求

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

n\*Device

n\*char[DEVICEID_LEN]

n 个设备的列表

m\*Value

m\*Sizeof(TThreshold)

m 个监控点门限值，数据的值的类型由相应的数据结构决定

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>SET_THRESHOLD</Name>

<Code>2001</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Value>

<DeviceList>

<Device Id="000000000001" Code=” 000000000001”>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

</Device>

<Device Id="000000000002" Code=”000000000002”>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

<TThreshold Type="" Id="" Threshold="" AbsoluteVal="" RelativeVal="" Status=""/>

</Device>

</DeviceList>

</Value>

</Info>

</Request>

响应：服务端

用户请求写监控点门限数据应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_THRESHOLD_ACK

Sizeof(long)

用户请求写监控点门限数据请求回应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

n\*Device

n\*char[DEVICEID_LEN]

n 个设备 ID 的列表

m\*Id

m\*Sizeof(long)

m 个写成功的 ID 的列表

t\*Id

t\*Sizeof(long)

t 个写失败的 ID 的列表

Result

EnumResult

写成功/失败（即控制的结果）

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SET_THRESHOLD_ACK</Name>

<Code>2002</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

<DeviceList>

<Device Id="000000000001" Code=” 000000000001”>

<SuccessList>

<Id/>

<Id/>

</SuccessList>

<FailList>

<Id/>

<Id/>

</FailList>

</Device>

<Device Id="000000000002" Code=” 000000000002”>

<SuccessList>

<Id/>

<Id/>

</SuccessList>

<FailList>

<Id/>

<Id/>

</FailList>

</Device>

</DeviceList>

</Info>

</Response>

用户获取 FSU 的注册信息
发起：客户端

用户获取注册信息报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_LOGININFO

Sizeof(long)

获取注册信息

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_LOGININFO</Name>

<Code>1501</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

</Info>

</Request>

响应：服务端

用户获取注册信息响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_LOGININFO_ACK

Sizeof(long)

获注册信息响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

IPSecUser

USER_LENGTH

IPSec 用户名：预留，上报空字段

IPSecPWD

PASSWORD_LEN

IPSec 密码：预留，上报空字段

IPSecIP

IP_LENGTH

IPSec 服务器 IP

SCIP

IP_LENGTH

SC IP

Device

n\*DEVICEID_LEN

DeviceID 列表

Result

EnumResult

成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_LOGININFO_ACK</Name>

<Code>1502</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<IPSecUser/>

<IPSecPWD/>

<IPSecIP/>

<SCIP/>

<DeviceList>

<Device Id=”” Code =””/>

<Device Id=”” Code =””/>

<Device Id=”” Code =””/>

</DeviceList>

<Result/>

</Info>

</Response>

用户设置 FSU 的注册信息
发起：客户端

用户设置注册信息报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET\_ LOGININFO

Sizeof(long)

设置注册信息

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

IPSecUser

USER_LENGTH

IPSec 用户名：预留，上报空字段

IPSecPWD

PASSWORD_LEN

IPSec 密码：预留，上报空字段

IPSecIP

IP_LENGTH

IPSec 服务器 IP

SCIP

IP_LENGTH

SC IP

Device

n\*DEVICEID_LEN

DeviceID 列表

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>SET_LOGININFO</Name>

<Code>1503</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<IPSecUser/>

<IPSecPWD/>

<IPSecIP/>

<SCIP/>

<DeviceList>

<Device Id=”” Code=””/>

<Device Id=”” Code=””/>

<Device Id=”” Code=””/>

</DeviceList>

</Info>

</Request>

响应：服务端

用户设置注册信息响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET\_ LOGININFO_ACK

Sizeof(long)

设置注册信息响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

设置成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SET\_ LOGININFO_ACK</Name>

<Code>1504</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

</Info>

</Response>

用户获取 FSU 的 FTP 用户、密码
发起：客户端

用户获取 FTP 用户、密码报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_FTP

Sizeof(long)

获取 FTP 用户、密码

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_FTP</Name>

<Code>1601</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

</Info>

</Request>

响应：服务端

用户获取 FTP 用户、密码响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_FTP_ACK

Sizeof(long)

获取 FTP 用户、密码响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

UserName

USER_LENGTH

用户登录名

Password

PASSWORD_LEN

密码

Result

EnumResult

成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_FTP_ACK</Name>

<Code>1602</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<UserName/>

<Password/>

<Result/>

</Info>

</Response>

用户设置 FSU 的 FTP 用户、密码
发起：客户端

用户设置 FTP 用户、密码报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_FTP

Sizeof(long)

设置 FTP 用户、密码

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

UserName

USER_LENGTH

用户登录名

Password

PASSWORD_LEN

密码

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>SET_FTP</PK_Type>

<PK_Type>

<Name>SET_FTP</Name>

<Code>1603</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<UserName/>

<Password/>

</Info>

</Request>

响应：服务端

用户设置 FTP 用户、密码响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_FTP_ACK

Sizeof(long)

设置 FTP 用户、密码响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

设置成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SET_FTP_ACK</Name>

<Code>1604</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

</Info>

</Response>

时间同步
发起：客户端

时间同步报文
变量名称/报文定义

长度及类型

描述

PK_Type

TIME_CHECK

Sizeof(long)

时间同步报文

Info

Time

Sizeof(TTime)

本机时间

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>TIME_CHECK</Name>

<Code>1301</Code>

</PK_Type>

<Info>

<Time>

<Years/>

<Month/>

<Day/>

<Hour/>

<Minute/>

<Second/>

</Time>

</Info>

</Request>

响应：服务端

时间同步应答报文
变量名称/报文定义

长度及类型

描述

PK_Type

TIME_CHECK_ACK

Sizeof(long)

时间同步回应

Info

Result

EnumResult

同步成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>TIME_CHECK_ACK</Name>

<Code>1302</Code>

</PK_Type>

<Info>

<Result/>

</Info>

</Response>

用户获取 FSU 的状态信息
发起：客户端

用户获取 FSU 状态信息报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_FSUINFO

Sizeof(long)

获取 FSU 状态信息

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

编码

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>GET_FSUINFO</Name>

<Code>1701</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

</Info>

</Request>

响应：服务端

用户获取 FSU 状态信息响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

GET_FSUINFO_ACK

Sizeof(long)

获取 FSU 状态信息响应

Info

FSUID

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

编码

TFSUStatus

Sizeof（TFSUStatus）

FSU 状态

Result

EnumResult

成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>GET_FSUINFO_ACK</Name>

<Code>1702</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<TFSUStatus>

<CPUUsage/>

<MEMUsage/>

</TFSUStatus>

<Result/>

</Info>

</Response>

用户重启 FSU
发起：客户端

用户重启 FSU 报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_FSUREBOOT

Sizeof(long)

重启 FSU 信息

Info

FSUID

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

编码

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Request>

<PK_Type>

<Name>SET_FSUREBOOT</Name>

<Code>1801</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

</Info>

</Request>

响应：服务端

用户重启 FSU 响应报文
变量名称/报文定义

长度及类型

描述

PK_Type

SET_FSUREBOOT_ACK

Sizeof(long)

重启 FSU 信息响应

Info

FsuId

char[FSUID_LEN]

FSU ID 号，资源系统的 ID

FsuCode

char[FSUCODE_LEN]

FSU 编码

Result

EnumResult

成功/失败

XML 样例

<?xml version=“1.0” encoding=“UTF-8”?>

<Response>

<PK_Type>

<Name>SET_FSUREBOOT_ACK</Name>

<Code>1802</Code>

</PK_Type>

<Info>

<FsuId/>

<FsuCode/>

<Result/>

</Info>

</Response>

FTP 接口能力
FSU 应提供 FTP 接口，通过 FSU 提供的 FTP 服务，SC 定期登录后取回 FSU 存储的视频监控图像文件。

FSU 做服务端，SC 是客户端。

FSU 存储的视频监控图像文件格式应为 JPG、PNG 之一，每个图片文件的大小不应超过 200k。

图片文件的命名规则：FSUID_YYYYMMDD_hhmmss_XX.jpg（或 png），YYYYMMDD 为四位年、两位月、两位日，例如 20140918；hhmmss 为两位小时、两位分钟、两位秒，例如 140523，“XX“为序号，当一秒内生成多张图像时，按顺序从 01 开始增 1 递增，如 01、02、03 等。

FSU 应在根目录建立一级子目录\PIC\，用以存放视频监控图像文件，并将此子目录设置为 FTP 默认的用户目录，SC 登录 FTP 后从此目录获取图像文件。FSU 自行维护\PIC\目录下的文件数目和磁盘空间，当达到存储上限时，建议采用新文件覆盖最早文件的方式进行滚动更新。

FSU 初始化能力
出厂初始化：FSU 在出厂时应内置初始化文件并已进行初始化。

安装后初始化：FSU 应提供 USB 接口和驱动，电脑可通过 USB 接口向 FSU 传输初始化配置文件，由 FSU 读取配置文件并完成 FSU 的初始化。

初始化文件采用以半角逗号（“,”）分割的 cvs 文件格式，命名为“init_list.cvs”。

FSU 应提供初始化手段，如初始化按键，按了初始化按键后，自动搜寻 init_list.cvs 文件并解析文件内容进行参量初始化。

FSU 自动升级能力
FSU 应具有自动升级能力，当通过 FTP 或 USB 接口向 FSU 上传升级文件后，重启 FSU 能自动完成升级。

SC 心跳功能
SC 需要通过 Webservice 定期获取 FSU 的状态信息，以便作为应用层的心跳线使用，FSU 收到 SC 的心跳报文要对 FSUID 进行判断，若 SC 平台下发的心跳包报文的 FSUID 与 FSU 本身的 ID 一致则返回成功结果，否则返回失败结果。

门限值配置
门限值配置，参考中国铁塔动环监控系统 统一信号字典表

告警回差
基于告警门限值只是一个临界点，为了提高可用性，增加了一个波动回差值，以告警门限值为基准，设定上下可波动的幅度，将临界点转换为一个临界区间，此区间范围内的跳变不影响系统告警的判断。具体参考中国铁塔动环监控系统统一信号字典表中的回差参数。

告警延时和告警恢复延时
告警延时
当实测值超过告警门限值时，为防止由于传感器采集精度引起的数值在门限值附近跳变以及通信故障导致频繁的告警产生及恢复，FSU 并不马上上报告警，而是延迟一段时间再上报。在延时的这段时间内告警若能自行恢复，则不再上报。原则上一级告警时延设置为 60 秒，二级告警时延设置为 120 秒，三级告警时延设置为 180 秒，四级告警时延设置为 240 秒，告警恢复延时统一调整为 20 秒。设置回差的告警因已考虑波动范围，不需要设置时延；门禁告警由于需要实时告警因此未设置延时。具体参考中国铁塔动环监控系统统一信号字典表的时延参数

告警恢复延时
当实测值恢复正常时，为防止由于传感器采集精度引起的数值在门限值附近跳变导致频繁的告警产生及恢复，FSU 并不马上撤销告警，而是过一段时间再发送告警恢复信号，也可以防止遥测量短时间频繁跳变。告警恢复延时统一调整为 20 秒。具体参考中国铁塔动环监控系统统一信号字典表的告警恢复时延参数。

注册模式
原有注册模式
原有注册模式是 FSU 向 SC 平台的注册发起注册指令（指令代码 101），SC 平台向 FSU 返回成功信息（指令代码 102）后再通过设置 FSU 注册信息指令（指令代码 1503）向 FSU 下发采集机信息，FSU 返回成功信息（指令代码 1504），原有的注册模式中 FSU 与 SC 平台的通信分为两次交互过程，FSU 与 SC 的注册流程示意图如下：

新的注册模式
原有注册模式是 FSU 向 SC 平台的注册发起注册指令（指令代码 101），SC 平台向 FSU 返回成功信息（指令代码 102）同时将分配的采集机 IP 反馈给 FSU，新的注册模式只有一次交互过程，FSU 与 SC 的注册流程示意图如下：
