+++
title= "Contact Tracing 技术实现解析"
date = 2020-04-18
description = ""
[taxonomies]
tags = ["programming", "covid-19"]
[extra]
giscus = "telescope"
+++

为了更好地应对 covid-19，[Apple](https://www.apple.com/covid19/contacttracing) 和 [Google](https://www.blog.google/inside-google/company-announcements/apple-and-google-partner-covid-19-contact-tracing-technology/) 联合发布了一项技术：「 Privacy-Preserving Contact Tracing」，在保护用户隐私的前提下，追踪联系人。这里的联系人不是通讯录里的联系人，而是真实世界中有过联系的人，更确切地说是在蓝牙范围内的人，路上并肩的行人也属于这个范畴。「追踪」是为了当有人确诊后，可以找到有过近距离接触的人，以便告知该信息。

Apple 和 Google 给出的技术方案从宏观来看是：把设备信息通过蓝牙传递到其他手机上，当有人确诊后，将 ta 的设备信息上传到云端，再推到其他手机上，通过比对本地保存的其他设备信息和接收到的设备信息是否匹配，来判定手机 owner 是否存在被感染风险。

为什么选择低功耗蓝牙，一个是主流移动设备基本都配备了该能力，这样就方便跨设备，甚至跨操作系统通信；同时低功耗可以避免给手机带来性能影响；蓝牙属于近场通信，也非常适合 covid-19 的场景。

其次设备信息这么传递，如何保障隐私不被泄漏呢，我们来看下这个问题

## 如何避免设备信息传递带来的隐私泄漏风险

如果设备信息就是固定的手机的 udid，或者对应的映射，攻击者就可以利用这个指纹做文章（比如查看另一个人的手机，看是否有某台设备的 udid，以确定两个人是否近距离接触过，或者持续监控/跟踪某台设备）。因此这里的 Key 应该是变的，同时又跟设备紧密相关，别人无法仿造和解密。白皮书里涉及到了 3 个 Key：

{{img(path="/posts/contact-tracing-tech-analyze/74ae60e45645cb3745de5b164fe647178a993e8e.jpg")}}

### Tracing Key （以下简称 TK）

一个设备只生成一次，保存在本地，不会被上传。它的目标是足够随机，不会与其他设备产生的 TK 冲突。

### Daily Tracing Key（以下简称 DTK）:

一天生成一次，一天内不变，从 Tracing Key 派生而来，使用 [HKDF](https://en.wikipedia.org/wiki/HKDF) 密钥算法（将较短的密钥生成较长的密钥，同时保证随机性），这个算法使用原始的密钥（Tracing Key）作为输入，使用 `DayNumber` 作为变量，因为 `DayNumber` 一天内不变，所以 DTK 一天内也不会变。

{{img(path="/posts/contact-tracing-tech-analyze/faa9b33a2cbe2d8caca14f5d9fe40488b0290982.png")}}

这个 Key 的设计目标是隐藏 TK（外部无法根据这个 Key 推测出 TK），同时不会与其他设备的 DTK 冲突。

### Rolling Proximity Identifier（以下简称 RPI）

一个广播周期内（比如 10 分钟）生成同一个 HMAC（密钥散列消息认证码）

{{img(path="/posts/contact-tracing-tech-analyze/5b07e24e0ab6fc016cd36a5926ae1a659ac0fb19.png")}}

dkt<sub>i</sub> 表示当天的 Daily Tracing Key，也就是 SHA-256 哈希函数的入参
TIN<sub>j</sub> 表示 TimeIntervalNumber，也就是当天第 j 轮广播周期，比如 10 分钟为一个周期（换一次 RPI）

{{img(path="/posts/contact-tracing-tech-analyze/64fd3c7f5c0e0c9f4f3a6ff28227e8ddbe39113f.png")}}

j 的取值区间就是 `[0,143]`

`RPI` 的设计目标是隐藏 DKT，同时支持 DKT 的验证（当某个人确诊后，可以通过 ta 的 DKT 计算 RPI 来验证）。

### 如何发送 RPI

前面提到的 3 个 Key，只有最后一个 RPI 会发送到其他设备上（TK 永远不会离开设备，DTK 只有确诊后才会提取其中的一个子集作为 Diagnosis Key），RPI 通过蓝牙发送到其他设备（关于低功耗蓝牙协议的说明，可以参考[这篇文章](https://www.cnblogs.com/iini/p/8969828.html)）。

发送（广播）流程如下：
{{img(path="/posts/contact-tracing-tech-analyze/c978802c2c011295dea09a857ca31ba24c56d004.jpg")}}

这里的通信双方分别是：advertiser（广播数据包）和 scanner（扫描响应包），前者在广播时间间隔内会不断广播数据，这些数据中会包含 RPI，scanner 接收到广播数据后会将 payload 中的 RPI 保存到本地。等切换到下一个时间窗口后，会生成并广播新的 RPI。跨天会以新的 DTK 为基础，生成并广播新的 RPI。

这个过程使用的是 Beaconing 协议，也就是接收方无需应答广播者的数据包，只要默默地把数据记下来就行。一个设备同时是广播者和扫描者。

#### 关于空间占用

一个 RPI 的长度是 16 字节，所以空间消耗非常少，即使接收到了 10000 个 RPI，也只会占用 156 K 的空间。但还是要有一个 Rotation 的机制，毕竟时间太长的 RPI 意义已经不大了。

这里还有一个潜在的风险是攻击者可以伪造大量的 RPI 数据给 Scanner，虽然每个 RPI 只有 16 字节，但仍有潜在的存储风险。所以 Scanner 的 scan 行为持续时间不能过长/过频繁，这同时也能节省电量。

### 如何接收 RPI

对于 Scanner 来说，流程更加简单，只要存储收到的 RPI 即可。如果云端有推送 Diagnosis Keys（确诊者上传的 DTK），就对它使用 SHA_256 算法（结合 TimeIntervalNumber）， 将结果与本地存储的 RPI 比对，如果 match，就有被感染的风险，系统会推送通知提醒。

{{img(path="/posts/contact-tracing-tech-analyze/9b0d919706658c6c62ab9b9baab4f7adec60427a.jpg")}}

## 关于 API

苹果和 Google 都放出了 API Interface，虽然没有具体的实现，但光是对比两家的 API 接口就能看出点门道，这个环节个人认为 Google 做得更好，苹果很「意外」地没有使用 Swift 来提供 API，OC 那冗长的语法和 Block，给 API 的友好度打了折扣

<a href="https://covid19-static.cdn-apple.com/applications/covid19/current/static/contact-tracing/pdf/ContactTracing-FrameworkDocumentation.pdf">
{{img(path="/posts/contact-tracing-tech-analyze/2b1faeb610533f0fb6da0f92d2f907a272f5ebec.jpg")}}
</a>

相比之下 Google 的 API 看着就舒服多了

<a href="https://blog.google/documents/55/Android_Contact_Tracing_API.pdf">
{{img(path="/posts/contact-tracing-tech-analyze/9dfa8c4a3c89e00c20b346c8fe6e06bfd02547d8.jpg")}}
</a>

## 小结

这个设计非常巧妙，不仅保护了用户隐私，也减少了服务端的压力，对于服务端只需存储和下发 Diagnosis Keys，不需要计算 Key 与 Key，Key 与设备之间的关联。设备也不会有很大的存储和计算压力。从扩展性来看，将来如果有类似的近距离传播流行病，可以复用这套技术。但 Android 设备因为众所周知的原因在国内推行这套基建会比较困难。

### 发散一下

这个设计中，主要用到了蓝牙和加密哈希算法，苹果在 iOS 13 中的 Find My 也是基于蓝牙和加密协议来实现的，使得手机即使处于离线状态（不要关机就行），依然可以被定位。原理是要拥有至少两台苹果设备（共享私钥），然后每台设备都以一定间隔发送不断变化的公钥，当被周边的苹果设备获取到后，该设备（就像一个跳板）会用这个公钥来加密当前的地理位置信息，上传到苹果服务器，另一台设备就可以用私钥来解开这个加密信息，得到地理位置。这个过程中上传地理位置的设备信息不会暴露（因为压根就没有上传），别人无法解密这个信息，因为基于蓝牙传输，也不需要依赖网络，不得不说也是非常精巧的设计。
