# 实施任务清单

## Change ID

`20260217120158-ssr-compatible-api-client`

## 任务列表

### 阶段 1: 重构统一API请求工具

- [x] 1.1 重构`src/lib/api/client.ts`为`request.ts`，移除`typeof window`判断
- [x] 1.2 添加服务端headers支持（通过函数参数传入）
- [x] 1.3 客户端自动从localStorage获取token（仅在客户端环境，使用`typeof window !== 'undefined'`检查）
- [x] 1.4 确保ky在服务端和客户端都能正常工作
- [x] 1.5 导出服务端友好的`get/post/put/patch/del`便捷函数
- [x] 1.6 重命名`createApiClient`为`createApiRequest`，`apiClient`为`apiRequest`
- [x] 1.7 实现便捷函数的headers处理逻辑（服务端传入，客户端自动获取）

### 阶段 2: 更新Hooks

- [x] 2.1 更新`src/lib/api/hooks.ts`使用新的请求工具创建方式
- [x] 2.2 确保hooks在客户端正常工作
- [x] 2.3 验证React Query集成正常

### 阶段 3: 更新示例代码和文档

- [x] 3.1 更新`src/features/products/api/products.ts`支持服务端调用
- [x] 3.2 创建服务端数据获取函数`fetchProducts`（支持headers参数）
- [x] 3.3 确保客户端hooks继续工作（使用`apiRequest`实例）
- [x] 3.4 更新`docs/api-request.md`文档（添加服务端和客户端使用示例）
- [x] 3.5 更新`README-ARCHITECTURE.md`（更新架构说明）

### 阶段 4: 测试和验证

- [x] 4.1 测试服务端组件数据获取
- [x] 4.2 测试客户端组件React Query hooks
- [x] 4.3 验证认证token在两种环境下的处理
- [x] 4.4 运行类型检查
- [x] 4.5 运行lint检查

## 实施顺序

按阶段顺序执行，每个阶段完成后进行验证。

## 完成总结

所有任务已完成：

- ✅ 文件重命名：`client.ts` → `request.ts`
- ✅ 函数重命名：`createApiClient` → `createApiRequest`，`apiClient` → `apiRequest`
- ✅ 实现便捷函数：`get/post/put/patch/del`，支持服务端和客户端使用
- ✅ Token处理：服务端通过headers传入，客户端自动从localStorage获取
- ✅ 服务端数据获取函数：`fetchProducts`支持headers参数
- ✅ 所有引用已更新（`hooks.ts`、`products.ts`、`index.ts`）
- ✅ 文档已更新（`docs/api-request.md`、`README-ARCHITECTURE.md`）
- ✅ 类型检查和lint通过

## 验证结果

### 功能验证
- ✅ 服务端组件可以使用`get/post/put/patch/del`函数，通过headers传入token
- ✅ 客户端组件可以使用React Query hooks，自动从localStorage获取token
- ✅ 便捷函数正确处理服务端和客户端的token获取逻辑
- ✅ 所有现有功能保持不变

### 代码质量
- ✅ TypeScript类型检查通过
- ✅ ESLint检查通过
- ✅ 代码格式化完成
