# 多 FSU 设备自动识别功能说明

## 功能概述

新的多 FSU 设备自动识别功能解决了之前系统只能处理固定 FSU ID 和设备 ID 组合的限制，现在支持：

1. **自动设备类型识别**：根据设备 ID 的特征码自动识别设备类型
2. **简化响应逻辑**：只改变 FSU ID 和 FSU Code，其他字段保持固定模板
3. **动态测量值**：只有 MeasuredVal 根据设备类型动态变化
4. **任意 FSU 支持**：支持任意 FSU ID 的设备请求，无需预先注册

## 设备类型识别规则

系统根据设备 ID 中的特征码自动识别设备类型：

| 设备类型     | 特征码         | 示例设备 ID    | 信号类型           |
| ------------ | -------------- | -------------- | ------------------ |
| FSU 主设备   | 与 FSU ID 相同 | 61080243800281 | 状态信号           |
| 开关电源     | 0600/0601/0602 | 61080240600278 | 电压、电流、频率等 |
| 水浸传感器   | 1840/1841      | 61080241840279 | 水浸状态           |
| 温湿度传感器 | 1830/1831      | 61080241830309 | 温度、湿度值       |
| 蓄电池       | 0700/0701/0702 | 61089440700375 | 电池电压           |
| 烟雾传感器   | 1820/1821      | 61089441820181 | 烟雾状态           |
| 红外传感器   | 1810/1811      | 61089441810120 | 红外状态           |
| 非智能门禁   | 9900/9901      | 61089449900035 | 门禁状态           |
| 梯次电池     | 4700/4701      | 61089444700207 | 电池参数           |
| 空调设备     | 1500/1501      | 61080241501046 | 温度、运行状态     |
| 通用设备     | 其他           | 任意 ID        | 基本状态           |

## 使用方法

### 1. 自动设备识别

系统无需预先配置，当收到 GET_DATA 请求时会自动：

```javascript
// 自动识别和响应过程
const deviceType = deviceDataManager.identifyDeviceType(deviceId, fsuId);
const deviceSignals = deviceDataManager.getDeviceSignalsWithDynamicData(
  deviceType,
  deviceId
);
// 构造响应，只使用请求中的FSU ID
const responseXml = `<Response>...<FsuId>${fsuId}</FsuId><FsuCode>${fsuId}</FsuCode>...`;
```

### 2. 处理 SC 服务器请求

当 SC 服务器发送 GET_DATA 请求时，系统会：

1. 解析请求中的 FSU ID 和设备 ID
2. 根据设备 ID 特征码自动识别设备类型
3. 使用固定的信号模板，只改变 MeasuredVal
4. 返回响应报文，FSU ID 和 FSU Code 使用请求中的值

### 3. 查看设备映射状态

通过 API 查看当前注册的设备映射：

```bash
GET /api/fsu/online/device-mappings
```

响应示例：

```json
{
  "success": true,
  "data": {
    "fsuCount": 2,
    "fsuDevices": [
      {
        "fsuId": "61080243800281",
        "deviceCount": 4,
        "devices": [
          "61080243800281",
          "61080241840279",
          "61080241830309",
          "61080240600278"
        ],
        "registeredAt": "2025-01-23T10:30:00.000Z",
        "config": {
          "siteName": "测试站点1",
          "softwareVendor": "ZXLW"
        }
      }
    ]
  }
}
```

## 报文处理流程

### 请求报文示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>GET_DATA</Name>
    <Code>401</Code>
  </PK_Type>
  <Info>
    <FsuId>61080243800281</FsuId>
    <FsuCode>61080243800281</FsuCode>
    <DeviceList>
      <Device Id="61080241840279" Code="61080241840279">
        <Id>9999999999</Id>
      </Device>
    </DeviceList>
  </Info>
</Request>
```

### 响应报文示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <PK_Type>
    <Name>GET_DATA_ACK</Name>
    <Code>402</Code>
  </PK_Type>
  <Info>
    <FsuId>61080243800281</FsuId>
    <FsuCode>61080243800281</FsuCode>
    <Result>1</Result>
    <Values>
      <DeviceList>
        <Device Id="61080241840279" Code="61080241840279">
          <TSemaphore Type="2" Id="0418001001" SetupVal="0" Status="0" MeasuredVal="0"/>
        </Device>
      </DeviceList>
    </Values>
  </Info>
</Response>
```

## 动态数据生成

每种设备类型都有对应的随机数据生成逻辑：

### 水浸传感器

- 信号 0418001001：固定为 0（无水浸）

### 温湿度传感器

- 温度（0418101001）：20-30℃ 随机变化
- 湿度（0418102001）：40-80% 随机变化

### 开关电源

- 电压（0406101001/0406102001/0406103001）：210-230V 随机变化
- 频率（0406110001）：49-51Hz 随机变化
- 信号 0406111001：53.5±0.4 变化

### 蓄电池

- 信号 0407102001：53.5±0.5 变化
- 信号 0407106001：26.75±0.2 变化
- 信号 0407107001：26.75±0.2 变化
- 信号 0407005001：固定为 0

### 烟雾传感器

- 信号 0418002001：固定为 0（无烟雾）

### 空调设备

- 信号 0415001001/0415002001/0415003001：固定为 0
- 信号 0415102001：23±2 变化
- 信号 0415105001：固定为 1
- 信号 0415110001：2±0.3 变化
- 信号 0415111001：2±0.3 变化
- 信号 0415112001：3±0.1 变化
- 信号 0415113001：220±0.2 变化
- 信号 0415114001：219±1 变化
- 信号 0415115001：固定值 221
- 信号 0415116001：24±3 变化
- 信号 0415117001：固定值 23
- 信号 0415118001：固定值 1

## 测试方法

### 1. 运行测试脚本

```bash
cd backend
# 测试更新后的设备测量值
node test-updated-values.js

# 简化响应测试
node test-simplified-response.js

# 完整功能测试
node test-multi-fsu-device-recognition.js
```

### 2. 手动测试步骤

1. **上线 FSU 设备**：通过前端界面添加 FSU 设备，配置子设备 ID
2. **查看映射状态**：访问 `/api/fsu/online/device-mappings` 查看注册情况
3. **模拟 SC 请求**：发送 GET_DATA 请求测试响应
4. **下线 FSU 设备**：删除 FSU 设备，验证映射是否正确清理

## 日志监控

系统会记录详细的设备识别和处理日志：

```
INFO: 注册FSU设备: 61080243800281 { fsuId: '61080243800281', deviceCount: 4, devices: [...] }
INFO: 映射设备: 61080241840279 -> water_sensor { fsuId: '61080243800281', deviceId: '61080241840279', deviceType: 'water_sensor' }
INFO: 处理设备数据请求 { fsuId: '61080243800281', deviceId: '61080241840279' }
INFO: 使用动态设备映射 { fsuId: '61080243800281', deviceId: '61080241840279', deviceType: 'water_sensor' }
INFO: 生成设备响应数据成功 { deviceType: 'water_sensor', fsuId: '61080243800281', deviceId: '61080241840279', signalCount: 1 }
```

## 故障排除

### 常见问题

1. **设备无法识别**

   - 检查设备 ID 是否符合识别规则
   - 查看日志中的设备类型识别过程
   - 未识别的设备会使用通用设备类型

2. **FSU ID 不匹配**

   - 确认请求中的 FSU ID 与注册时的 FSU ID 一致
   - 系统会记录 FSU ID 不匹配的警告日志

3. **响应生成失败**
   - 检查设备是否正确注册
   - 查看设备映射状态 API 的返回结果
   - 确认设备模板是否正确创建

### 调试技巧

1. **启用详细日志**：设置日志级别为 debug
2. **使用测试脚本**：运行测试脚本验证功能
3. **查看映射状态**：通过 API 查看当前设备映射情况
4. **监控实时日志**：观察系统处理请求的详细过程

## 优势特性

1. **零配置**：无需预先注册 FSU 设备，自动识别任意 FSU ID
2. **简化逻辑**：只改变 FSU ID/FSU Code 和 MeasuredVal，其他字段固定
3. **智能识别**：基于设备 ID 特征码自动识别设备类型
4. **动态测量值**：MeasuredVal 根据设备类型动态变化
5. **完整模板**：基于真实报文的完整信号模板
6. **高性能**：无需复杂映射管理，直接响应

## 核心特点

- **FSU ID 动态化**：响应报文中的 FSU ID 和 FSU Code 直接使用请求中的值
- **设备 ID 保持**：设备 ID 和 Code 保持请求中的原始值
- **模板固化**：Type、Id、SetupVal、Status 等字段使用固定模板
- **测量值动态**：只有 MeasuredVal 根据设备类型生成动态数据

这个功能完全满足您的需求：**只需要改变 FSU ID 和 FSU Code，其他不变，除了 MeasuredVal 根据设备动态变化**。
