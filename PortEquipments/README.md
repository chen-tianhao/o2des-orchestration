# Port-3JS · Dual Trolley Quay Crane Demo

基于 Three.js 构建的 PSA Tuas F2 双小车岸桥（Dual Trolley Quay Crane，DTQC）演示场景，展示 Gantry 行走、Primary/Secondary Trolley 以及交接平台的协同动作。

## 特性

- **高精度结构**：包含门座、前伸臂、后平衡臂、配重、检修平台、梯道、操作室等细节。
- **真实尺度**：四立柱矩形布置，轨距 35 m、基距 20 m，主臂外伸 75 m、回转内伸 25 m，与 PSA Tuas 双小车岸桥参数一致。
- **双小车联动**：主小车沿海侧方向运行（垂直于 Gantry），完成船舱↔交接平台作业；副小车沿陆侧方向运行，负责平台↔AGV 的交接，二者均具备水平移动与吊具升降。
- **自动循环演示**：模拟 PSA Tuas F2 DTQC 的标准作业流程，并以阶段提示展示作业状态。
- **手动模式**：通过控制面板滑杆调节 Gantry、两台小车位置与吊具高度，观察结构响应。
- **界面美化**：提供 HUD、AGV 泊位与船舶剪影，搭配夜景光照营造港口氛围。

## 快速开始

1. 在仓库根目录打开终端，使用任意静态服务器（示例为 Python）：

   ```powershell
   cd E:\github_code\HandMadeGames
   python -m http.server 8080
   ```

2. 在浏览器访问 `http://localhost:8080/Port-3JS/index.html`。

3. 使用 OrbitControls 拖拽视角，切换 GUI 中的自动/手动模式：
   - **AUTO**：自动播放一个完整的装卸循环，左上角显示当前阶段。
   - **MANUAL**：激活滑杆，细调 Gantry、Primary/Secondary Trolley 与交接平台。

## 结构说明

`Port-3JS` 目录包含：

- `index.html`：导入 Three.js & lil-gui，创建场景与 UI。  
- `style.css`：界面与控制面板样式。  
- `main.js`：初始化场景、灯光、环境模型，驱动动画循环。  
- `quayCrane.js`：`DualTrolleyQuayCrane` 类，封装 DTQC 结构与自动/手动控制接口。  

欢迎进一步扩展 AGV、船舶、场桥等系统，实现更完整的港口数字孪生可视化。