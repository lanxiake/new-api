# 第12篇：让程序记住数据——数据库入门

> 系列：《人人都能用AI写程序》第三章·实战篇 · 第12/14篇
> 适合读者：程序已上线、但重新部署后数据丢失的读者
> 阅读时间：约 13 分钟

---

上一篇，你把记账工具部署到了 Railway，拿到了可以分享的链接。

但你很快发现一个问题：重新部署之后，之前记录的账目全消失了。

这不是 bug，这是预期行为——**文件存储不适合云端环境**。

解决方法只有一个：用数据库。

---

## 本篇你能学到

- 数据库是什么（用生活类比理解）
- 数据库 vs 文件存储，本质区别在哪
- 实操：把记账工具的 JSON 文件换成 SQLite 数据库
- 理解 SQL 四条核心语句（增删改查）

---

## 理论：数据库是什么

把数据库想象成一个**超级进化版的 Excel 表格**：

- 可以同时被多人读写（不会打架）
- 可以处理百万行数据（不会卡）
- 数据持久存储（程序重启不会丢）
- 支持复杂查询（按日期、金额、类别筛选）

<!-- IMAGE:01 type=cover path=images/01-cover.png -->

**为什么 JSON 文件不行？**

| 对比项 | JSON 文件 | 数据库 |
|--------|---------|--------|
| 并发读写 | 会冲突 | 安全处理 |
| 数据量 | 大了就慢 | 百万行无压力 |
| 查询筛选 | 要自己写代码 | SQL 一行搞定 |
| 云端持久化 | 重启就丢 | 独立存储，不丢 |

<!-- IMAGE:02 type=infographic path=images/02-db-vs-file.png -->

**SQLite——最适合入门的数据库**

数据库有很多种：MySQL、PostgreSQL、MongoDB……

我们用 **SQLite**，原因：
- 不需要安装服务器，就是一个文件
- Python 内置支持，零配置
- 小到中型应用完全够用
- 本地开发简单，Railway 也支持挂载持久化

---

## 理论：SQL 四条核心语句

数据库用 SQL 语言操作，你只需要记住 4 条：

```sql
-- 增：插入一条记录
INSERT INTO records (date, amount, type, note)
VALUES ('2025-01-01', 50.0, '支出', '午饭');

-- 删：删除一条记录
DELETE FROM records WHERE id = 3;

-- 改：更新一条记录
UPDATE records SET amount = 60.0 WHERE id = 3;

-- 查：查询所有记录
SELECT * FROM records ORDER BY date DESC;
```

记不住没关系——**这四条语句，让 AI 帮你生成**。你需要理解的是：数据库操作的本质就是这四件事。

---

## 实操：把记账工具接入 SQLite

### 第一步：让 AI 帮你迁移数据存储

直接给 AI 一个完整的指令：

```
我的记账工具现在用 data.json 存数据，部署到 Railway 后重启就丢失了。
请帮我把数据存储改成 SQLite 数据库，要求：

1. 数据库文件名：accounting.db
2. 创建 records 表，字段：
   - id：自增主键
   - date：日期（TEXT，格式 YYYY-MM-DD）
   - amount：金额（REAL）
   - type：类型（TEXT，"收入" 或 "支出"）
   - note：备注（TEXT）
   - created_at：创建时间（TEXT，ISO格式）

3. 迁移所有操作：
   - 添加记录 → INSERT INTO records
   - 查询所有记录 → SELECT * FROM records ORDER BY date DESC
   - 按月统计 → SELECT SUM(amount) WHERE type='收入' 等
   - 删除记录 → DELETE FROM records WHERE id=?

4. 如果 data.json 存在，把现有数据迁移到数据库

请修改 accounting.py，不要改变接口（Flask API 路由保持不变）。
```

### 第二步：在本地测试

AI 修改完之后，先在本地跑通：

```bash
python accounting.py
```

打开浏览器访问 `localhost:5000`，试一下：
- 添加一笔收入
- 添加一笔支出
- 刷新页面——数据还在吗？
- 关掉再重开——数据还在吗？

如果数据在，SQLite 就集成成功了。

<!-- IMAGE:03 type=screenshot path=images/03-sqlite-working.png -->

### 第三步：在 Railway 上配置持久化存储

SQLite 还有一个问题：Railway 的文件系统默认是临时的，重新部署后 `accounting.db` 也会消失。

解决方法是挂载持久化卷（Persistent Volume）：

```
我在 Railway 部署 Flask + SQLite 应用。
每次重新部署后，accounting.db 文件会消失。
请告诉我怎么在 Railway 上：
1. 创建一个持久化卷（Persistent Volume）
2. 把卷挂载到 /data 目录
3. 修改代码，把数据库路径改为 /data/accounting.db
   （本地开发时保持 accounting.db 不变，通过环境变量区分）
```

AI 会给你具体的步骤，包括在 Railway 控制台操作的每一步。

### 第四步：部署并验证

```bash
git add .
git commit -m "feat: 将数据存储从JSON迁移到SQLite"
git push
```

Railway 自动部署，等 2-3 分钟。

访问你的线上链接，添加几条记录，然后手动重新部署（Railway 控制台里点 Redeploy）——数据还在，说明持久化成功了。

---

## 成果

你现在有什么：

- 一个**数据真正持久化的记账工具**
- 理解了数据库 vs 文件存储的本质区别
- 掌握了 SQL 四条核心操作（增删改查）
- 知道如何在云端配置持久化存储

你的程序从"玩具"变成了"真实应用"——具备了商业应用的基础数据层。

---

## 避坑：数据库最常见的三个问题

**问题 1：`sqlite3.OperationalError: no such table`**

数据库文件存在，但表不存在——通常是第一次运行时建表代码没执行。

```
我运行 Flask 应用时报错：sqlite3.OperationalError: no such table: records
请帮我检查数据库初始化代码，确保 CREATE TABLE IF NOT EXISTS 在应用启动时被调用。
```

**问题 2：并发写入报错（`database is locked`）**

SQLite 对并发写入支持有限，多个请求同时写入会锁表。

解决方法有两个：
- 简单方案：让 AI 加上重试逻辑（3次重试，每次等100ms）
- 彻底方案：换 PostgreSQL（Railway 免费提供）

```
我的 SQLite 应用偶尔报 database is locked 错误。
请帮我评估：是加重试逻辑，还是迁移到 PostgreSQL 更合适？
如果是PostgreSQL，请给我迁移步骤。
```

**问题 3：想把本地数据导入线上**

本地开发了一堆测试数据，想导出后导入到线上：

```
我的本地 accounting.db 有测试数据，想导出并导入到 Railway 的生产数据库。
请告诉我用 sqlite3 命令行导出/导入数据的步骤，以及迁移时需要注意什么。
```

---

## 本篇小结

三句话，可以截图保存：

1. **数据库 = 持久化 + 并发安全 + 高效查询**，JSON 文件三项都不满足，用数据库是必然选择
2. **SQLite 入门首选**：零配置、Python 内置、一个文件搞定，再复杂了再换 PostgreSQL
3. **SQL 四条语句**：INSERT（增）、DELETE（删）、UPDATE（改）、SELECT（查）——记不住让 AI 写，但要理解逻辑

---

## 下一篇预告

数据库解决了数据持久化。但你的工具还是"孤岛"——只能处理自己的数据。

如果想接入实时汇率、发送通知、或者调用地图，就需要用到别人提供的能力——API。

**《第13篇：调用别人的能力——API 是什么、怎么用》**，下周五见。

---

**给你一个问题**

你的数据持久化了，接下来最想给记账工具加什么功能？

**留言告诉我**——最多的需求我会在后续实战篇里做成真实案例。

---

*《人人都能用 AI 写程序》系列每周二、周五更新，跟着一步步来，下节见。*

---

*作者：不懂技术的技术号*
