/* 家电选题日报 v4.0 · 编导视角 · 2026-07-04 01:27 */
const TODAY_DATA = {
  "date": "2026-07-04",
  "generated_at": "01:27",
  "freshness_cutoff": "30天",
  "total_today": 4,
  "top_picks": [
    {
      "rank": 1,
      "topic": "厨电选购攻略",
      "category": "厨电",
      "platform": "小红书",
      "why": "选购攻略类内容互动100,289，正值厨电消费旺季，用户决策需求强",
      "angle": "选购攻略向",
      "suggested_title": "厨电千万别乱买！记住这5点，导购都夸你内行",
      "reference": {
        "title": "油烟机怎么选？记住这8点！",
        "author": "小红书@马尼真能装啊（硬装中）",
        "url": "https://www.xiaohongshu.com/explore/67a3695c000000001703ab45",
        "interactions": 100289,
        "platform": "小红书",
        "comments": 3528
      }
    },
    {
      "rank": 2,
      "topic": "空调选购攻略",
      "category": "空调",
      "platform": "抖音",
      "why": "选购攻略类内容互动60,159，正值空调消费旺季，用户决策需求强",
      "angle": "选购攻略向",
      "suggested_title": "空调千万别乱买！记住这8点，导购都夸你内行",
      "reference": {
        "title": "夏天开空调像打仗？换了这台格力，家里终于不吵了！#格力空调#格力云之舒柜机#立式空调#空调推荐#心动是家也是你",
        "author": "抖音@老张科技测评",
        "url": "https://www.douyin.com/video/7648940487919222969",
        "interactions": 60159,
        "platform": "抖音",
        "comments": 402
      }
    },
    {
      "rank": 3,
      "topic": "冰箱热门话题",
      "category": "冰箱",
      "platform": "小红书",
      "why": "小红书上冰箱内容互动54,196，是当前热门话题",
      "angle": "热点追踪向",
      "suggested_title": "冰箱千万别乱买！记住这6点，导购都夸你内行",
      "reference": {
        "title": "只买对不买贵！原来这样选冰箱才不会翻车",
        "author": "小红书@老杨测评官",
        "url": "https://www.xiaohongshu.com/explore/68e8243d00000000040115d0",
        "interactions": 54196,
        "platform": "小红书",
        "comments": 544
      }
    }
  ],
  "comment_insights": {
    "top_questions": [
      {
        "question": "开放厨房，做饭油烟比较大，总17层，住10层，适合哪种烟机？有性价比高的推荐吗？烟机灶具预算一共4000左右",
        "likes": 3,
        "source": "油烟机怎么选？记住这8点！"
      },
      {
        "question": "没海尔？",
        "likes": 2,
        "source": "冰箱选购指南，8买8不买！"
      },
      {
        "question": "您好 背后是窗户 想换个油烟机 怎么选",
        "likes": 0,
        "source": "油烟机怎么选？记住这8点！"
      },
      {
        "question": "那有没有推荐啊，那么多款式怎么抄作业",
        "likes": 0,
        "source": "只买对不买贵！原来这样选冰箱才不会翻车"
      },
      {
        "question": "美的521怎么样",
        "likes": 0,
        "source": "冰箱选购指南，8买8不买！"
      },
      {
        "question": "最窄的，宽度600mm左右，有什么推荐吗？",
        "likes": 0,
        "source": "冰箱选购指南，8买8不买！"
      },
      {
        "question": "海尔不能买？",
        "likes": 0,
        "source": "冰箱选购指南，8买8不买！"
      },
      {
        "question": "这些都可以嵌入式吗，能开门吗",
        "likes": 0,
        "source": "冰箱选购指南，8买8不买！"
      },
      {
        "question": "海尔655L可以吗",
        "likes": 0,
        "source": "冰箱选购指南，8买8不买！"
      }
    ],
    "top_complaints": [
      {
        "complaint": "您好 预算2000左右 8楼 想要顶吸 噪音小 自清洁 可以选哪款呢",
        "likes": 1,
        "source": "油烟机怎么选？记住这8点！"
      }
    ],
    "hot_keywords": [
      {
        "keyword": "推荐",
        "count": 15
      },
      {
        "keyword": "怎么选",
        "count": 1
      },
      {
        "keyword": "噪音",
        "count": 1
      }
    ],
    "total_mined": 30
  },
  "title_formulas": [
    {
      "pattern": "导购不会告诉你的秘密",
      "regex": "导购|销售|不会告诉你|潜台词",
      "examples": [
        {
          "title": "空调怎么选不踩坑假如导购讲真话 #空调 #空调怎么选 #家电 #装修 #避坑指南",
          "eng": 674490,
          "source": "抖音@李莽（家装家电避坑版）"
        },
        {
          "title": "假如导购说真话，空调这么选不踩坑#空调 #空调怎么选 #家电 #装修 #避坑指南",
          "eng": 280804,
          "source": "抖音@老张讲厨电"
        },
        {
          "title": "电视怎么选不踩坑？听懂导购潜台词#电视#电视怎么选#海信小墨E5SPro#家电#装修",
          "eng": 17300,
          "source": "抖音@乐白优选家电"
        },
        {
          "title": "家电安装这些坑一定要知道  搞懂安装师傅潜台词 #家电 #家电安装 #装修 #避坑指南 #装修细节",
          "eng": 457422,
          "source": "抖音@乐白优选家电"
        },
        {
          "title": "冰箱怎么选不踩坑听懂导购潜台词，轻松拿捏 #冰箱 #冰箱怎么选 #买冰箱 #家电 #装修",
          "eng": 448364,
          "source": "抖音@乐白优选家电"
        },
        {
          "title": "假如导购说真话，空调这么选不踩坑#空调 #空调怎么选 #家电 #装修 #避坑指南",
          "eng": 280804,
          "source": "抖音@老张讲厨电"
        },
        {
          "title": "家电安装这些坑一定要知道  搞懂安装师傅潜台词 #家电 #家电安装 #装修 #避坑指南 #装修细节",
          "eng": 457422,
          "source": "抖音@乐白优选家电"
        },
        {
          "title": "冰箱怎么选不踩坑听懂导购潜台词，轻松拿捏 #冰箱 #冰箱怎么选 #买冰箱 #家电 #装修",
          "eng": 448364,
          "source": "抖音@乐白优选家电"
        },
        {
          "title": "家电安装这些坑一定要知道  搞懂安装师傅潜台词 #家电 #家电安装 #装修 #避坑指南 #装修细节",
          "eng": 457422,
          "source": "抖音@乐白优选家电"
        }
      ],
      "power": "中",
      "why": "制造信息差，暗示\"内幕消息\"",
      "viral_count": 9,
      "total_eng": 3522392
    },
    {
      "pattern": "记住这X句话/X个原则就够了",
      "regex": "记住这\\d+|这\\d+句|这\\d+个原则",
      "examples": [
        {
          "title": "油烟机怎么选？记住这8点！",
          "eng": 100289,
          "source": "小红书@马尼真能装啊（硬装中）"
        }
      ],
      "power": "中",
      "why": "降低认知负担，承诺简单易懂",
      "viral_count": 1,
      "total_eng": 100289
    },
    {
      "pattern": "拆了X才知道...",
      "regex": "拆了|拆机|拆解.+才知道|拆开看",
      "examples": [
        {
          "title": "当老牌企业开始搞AI节能，是不是想阉割减配...拆了看！#格力空调#格力云佳Pro柜机#立式空调#空",
          "eng": 81141,
          "source": "抖音@剁手差评哥"
        }
      ],
      "power": "高",
      "why": "好奇心+硬核信任，适合拆机类内容",
      "viral_count": 1,
      "total_eng": 81141
    },
    {
      "pattern": "X个不选/X买X不买",
      "regex": "\\d+不选|\\d+买\\d+不买|买不买",
      "examples": [
        {
          "title": "冰箱选购指南，8买8不买！",
          "eng": 7819,
          "source": "小红书@家电老炮"
        }
      ],
      "power": "高",
      "why": "清单体+避坑，适合收藏，小红书最容易爆的公式",
      "viral_count": 1,
      "total_eng": 7819
    }
  ],
  "timing_alerts": [
    {
      "event": "夏季高温期",
      "category": "空调/风扇/冰箱",
      "direction": "选购/清洗/省电/安装",
      "urgency": "high",
      "days_left": 10,
      "status": "进行中"
    },
    {
      "event": "三伏天将至",
      "category": "空调/除湿机/电风扇",
      "direction": "高温家电选购+除湿防潮",
      "urgency": "high",
      "days_left": 41,
      "status": "进行中"
    }
  ],
  "category_trend": [
    {
      "category": "洗衣机",
      "total_items": 8,
      "today_items": 1,
      "total_interactions": 5675317,
      "avg_score": 9.1,
      "trend_icon": "🔥"
    },
    {
      "category": "综合家电",
      "total_items": 13,
      "today_items": 1,
      "total_interactions": 2642938,
      "avg_score": 8.2,
      "trend_icon": "🔥"
    },
    {
      "category": "空调",
      "total_items": 12,
      "today_items": 2,
      "total_interactions": 2278585,
      "avg_score": 8.8,
      "trend_icon": "🔥"
    },
    {
      "category": "冰箱",
      "total_items": 7,
      "today_items": 5,
      "total_interactions": 1202353,
      "avg_score": 9.4,
      "trend_icon": "🔥"
    },
    {
      "category": "厨电",
      "total_items": 8,
      "today_items": 3,
      "total_interactions": 100440,
      "avg_score": 8.9,
      "trend_icon": "🔥"
    },
    {
      "category": "电视",
      "total_items": 4,
      "today_items": 1,
      "total_interactions": 17326,
      "avg_score": 8.3,
      "trend_icon": "📈"
    },
    {
      "category": "小家电",
      "total_items": 7,
      "today_items": 2,
      "total_interactions": 0,
      "avg_score": 6.2,
      "trend_icon": "💤"
    },
    {
      "category": "清洁电器",
      "total_items": 1,
      "today_items": 0,
      "total_interactions": 0,
      "avg_score": 4.5,
      "trend_icon": "💤"
    }
  ],
  "items": [
    {
      "title": "油烟机怎么选？记住这8点！",
      "url": "https://www.xiaohongshu.com/explore/67a3695c000000001703ab45",
      "source": "小红书@马尼真能装啊（硬装中）",
      "tier": "H5",
      "weight": 70,
      "category": "厨电",
      "douyin_interactions": 100289,
      "douyin_comments": 3528,
      "douyin_liked": 21323,
      "douyin_collected": 23970,
      "heat_score": 9,
      "score": 9.5,
      "angle": "厨电行业动态+选购参考",
      "title_suggest": "",
      "category_bonus": 0.8
    },
    {
      "title": "只买对不买贵！原来这样选冰箱才不会翻车",
      "url": "https://www.xiaohongshu.com/explore/68e8243d00000000040115d0",
      "source": "小红书@老杨测评官",
      "tier": "H5",
      "weight": 70,
      "category": "冰箱",
      "douyin_interactions": 54196,
      "douyin_comments": 544,
      "douyin_liked": 16751,
      "douyin_collected": 12119,
      "heat_score": 8,
      "score": 9.5,
      "angle": "冰箱选购",
      "title_suggest": "冰箱选购不翻车指南：只买对不买贵",
      "category_bonus": 1.5
    },
    {
      "title": "冰箱选购指南，8买8不买！",
      "url": "https://www.xiaohongshu.com/explore/69d8bad100000000210049dd",
      "source": "小红书@家电老炮",
      "tier": "H5",
      "weight": 70,
      "category": "冰箱",
      "douyin_interactions": 7819,
      "douyin_comments": 50,
      "douyin_liked": 2001,
      "douyin_collected": 1906,
      "heat_score": 5,
      "score": 9.5,
      "angle": "选购攻略",
      "title_suggest": "油烟机选购指南：八大要点，选购不踩坑！",
      "category_bonus": 1.5
    },
    {
      "title": "夏天开空调像打仗？换了这台格力，家里终于不吵了！#格力空调#格力云之舒柜机#立式空调#空调推荐#心动是家也是你",
      "url": "https://www.douyin.com/video/7648940487919222969",
      "source": "抖音@老张科技测评",
      "tier": "H1",
      "weight": 90,
      "category": "空调",
      "douyin_interactions": 60159,
      "douyin_comments": 402,
      "douyin_pub_date": "2026-06-09",
      "zpid": "7648940487919222969",
      "comment_status": "未抓取",
      "heat_score": 8,
      "score": 8.5,
      "angle": "空调使用体验",
      "title_suggest": "格力云之舒柜机，夏日空调噪音烦恼终结者"
    }
  ],
  "ideas": [
    {
      "title_a": "夏季空调选购攻略：避开这些常见误区",
      "title_b": "夏季空调怎么选？揭秘选购技巧和保养秘籍",
      "category": "空调",
      "angle": "从用户常见误区出发，介绍选购空调的正确方法，并给出保养建议。",
      "reason": "根据相关数据，夏季空调选购类内容互动量高，用户关注度高。",
      "diff": "避开传统选购误区，从用户实际需求出发，提供实用选购建议。",
      "toutiao_tip": "增加对比图和安装流程图，提升内容易读性。",
      "refs": [
        1
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "冰箱新选择：无霜技术大揭秘，告别传统冰箱烦恼",
      "title_b": "如何选择一台适合自己的无霜冰箱？这几点不容忽视",
      "category": "冰箱",
      "angle": "分析无霜冰箱的优势，并给出选购建议。",
      "reason": "夏季高温，无霜冰箱需求量大，相关内容互动量高。",
      "diff": "深入分析无霜技术，与传统冰箱对比，突出无霜冰箱优势。",
      "toutiao_tip": "添加对比表和选购要点，便于用户快速了解。",
      "refs": [
        2
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "洗衣机夏季使用指南：这些细节不能忽视",
      "title_b": "夏季洗衣机清洗技巧，告别细菌滋生",
      "category": "洗衣机",
      "angle": "针对夏季洗衣机使用特点，提供清洗和保养建议。",
      "reason": "夏季衣物清洗需求增加，相关内容互动量高。",
      "diff": "从实际使用角度出发，给出针对性的清洗和保养建议。",
      "toutiao_tip": "增加操作步骤图和保养技巧，提升内容实用性。",
      "refs": [
        3
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "电视选购攻略：高清、智能、4K，你了解多少？",
      "title_b": "电视怎么选？高清、智能、4K，教你分辨电视性能",
      "category": "电视",
      "angle": "分析电视选购要点，如高清、智能、4K等。",
      "reason": "电视作为家庭娱乐设备，选购内容互动量高。",
      "diff": "从电视性能出发，给出具体选购建议。",
      "toutiao_tip": "增加电视性能对比表和选购要点，便于用户快速了解。",
      "refs": [
        4
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "热水器夏季使用注意事项：安全、节能、健康",
      "title_b": "热水器夏季使用攻略：安全、节能、健康，你做到了吗？",
      "category": "热水器",
      "angle": "介绍热水器夏季使用注意事项，如安全、节能、健康等。",
      "reason": "夏季使用热水器需求量大，相关内容互动量高。",
      "diff": "从安全、节能、健康等方面出发，给出具体使用建议。",
      "toutiao_tip": "增加使用注意事项图和使用技巧，提升内容实用性。",
      "refs": [
        5
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "油烟机选购攻略：高效、静音、易清洁，你选对了吗？",
      "title_b": "如何选购一台适合自己的油烟机？这几点要注意",
      "category": "油烟机",
      "angle": "分析油烟机选购要点，如高效、静音、易清洁等。",
      "reason": "夏季油烟机需求量大，相关内容互动量高。",
      "diff": "从油烟机性能出发，给出具体选购建议。",
      "toutiao_tip": "增加油烟机性能对比表和选购要点，便于用户快速了解。",
      "refs": [
        6
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "夏季家居清洁神器：吸尘器、扫地机器人推荐",
      "title_b": "夏季家居清洁攻略：吸尘器、扫地机器人怎么选？",
      "category": "其他",
      "angle": "推荐夏季家居清洁神器，如吸尘器、扫地机器人。",
      "reason": "夏季家居清洁需求量大，相关内容互动量高。",
      "diff": "从家居清洁角度出发，推荐实用清洁工具。",
      "toutiao_tip": "增加产品对比表和使用场景图，提升内容实用性。",
      "refs": [
        7
      ],
      "difficulty": "medium"
    },
    {
      "title_a": "夏季饮水健康指南：净水器选购技巧和安全使用建议",
      "title_b": "夏季饮水健康攻略：净水器怎么选？安全使用要注意什么？",
      "category": "净水器",
      "angle": "介绍净水器选购技巧和安全使用建议。",
      "reason": "夏季饮水需求量大，相关内容互动量高。",
      "diff": "从饮水健康角度出发，给出具体选购和使用建议。",
      "toutiao_tip": "增加净水器性能对比表和使用技巧，提升内容实用性。",
      "refs": [
        8
      ],
      "difficulty": "medium"
    }
  ]
};
