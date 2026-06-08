# resleri-ls
本项目的目的是一个易维护的resleri图鉴，避免再次出现图鉴维护者停止维护后玩家失去方便的工具的情况。

## 灵感来源
- https://github.com/pomucat/resleri-checker
- https://github.com/Nohminist/resleri

## 更新方式
- 通过 https://github.com/theBowja/resleriana-db 或 https://github.com/hax0r31337/resleriana_tools 等解包工具获取masterdata以及角色头像文件。具体使用方式可参考 https://bbs.nga.cn/read.php?tid=39869227
- 将masterdata中的/jp文件夹直接复制到本项目/data_raw文件夹中，覆盖已有的文件。
- 将角色头像(*_FACE_M.png)的文件名改为对应角色的id，放到/image/character文件夹中。
- 部署到github page。

## 其他
- /config文件夹中包含了各种需要手动维护的列表。
- announcements.json为公告，可按需添加。
- atelier_fes.json为白票/星祈石的卡池范围，通过最早的角色加入日期和最后一个角色的加入日期控制。
- ex_skill_rules.json为各种ex技能的例外，由于ex技能实际被用于实现多种不同的机制，如果有新的机制出现需要手动加入。
- exclude.json为一些不需要显示的模版角色。
- permanent_exclude.json为非恒常角色，包括联动角色和追忆角色。
- pipeline.json是prebuild流程使用的，没有新的需要引入的数据时不需要改动。
- todo.md是在试验页上的todo清单。
- transform.json是变身角色，每个数组包括变身前变身后的两个id。
