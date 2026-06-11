// ============================================
// GACHA SYSTEM - Items Data & Draw Logic
// ============================================

export interface GachaItem {
  id: string
  category: "food" | "equip" | "coupon" | "lore"
  rarity: 0 | 1 | 2 | 3 // 0 = no rarity (coupon/lore), 1/2/3 = star level
  name: string
  emoji: string
  desc: string
}

export interface CollectionEntry {
  itemId: string
  count: number
  firstGotAt: string
}

export interface GachaResult {
  item: GachaItem
  reward: { xp: number; coins: number }
  isCoupon: boolean
}

// --- Constants ---
export const GACHA_COST = 30
export const COUPONS_FOR_FREE = 3

const CATEGORY_WEIGHTS: Record<string, number> = { food: 25, equip: 25, coupon: 25, lore: 25 }
const RARITY_WEIGHTS: Record<number, number> = { 1: 60, 2: 30, 3: 10 }
const RARITY_XP: Record<number, number> = { 1: 10, 2: 20, 3: 30 }
const RARITY_COINS: Record<number, number> = { 1: 5, 2: 10, 3: 15 }

// --- Items Data ---
// To add/remove items: just edit this array. No other code changes needed.
// 「」内的台词会在展示时换行显示（UI 层通过 splitDesc 处理）
export const GACHA_ITEMS: GachaItem[] = [
  // 🍜 Food (★/★★/★★★) — gives XP
  { id: "food_1", category: "food", rarity: 1, name: "便利店饭团", emoji: "🍙",
    desc: `711货架上最后一个金枪鱼饭团，你想要的奥尔良鸡肉口味已被10点前到达的玩家购入，饱腹值+5，但满足感-1。「"你好，帮我加热一下。"」` },
  { id: "food_2", category: "food", rarity: 1, name: "食堂盖浇饭", emoji: "🍛",
    desc: `食堂最火爆档口，每次都大排长龙。打菜阿姨的手抖幅度决定今天的饱腹上限，多喊一声"阿姨"有概率触发暴击加量。「"够了够了够了——"」` },
  { id: "food_3", category: "food", rarity: 1, name: "泡面·老坛酸菜味", emoji: "🍜",
    desc: `deadline周的深夜伴侣。泡下去的三分钟是你今天唯一的休息时间。整个宿舍楼都闻到了，但没人说什么，因为大家都在赶ddl。「"这酸爽，不敢相信。"」` },
  { id: "food_4", category: "food", rarity: 1, name: "秋天的第一杯奶茶", emoji: "🧋",
    desc: `秋天限定社交道具。真正的作用不是喝，是发朋友圈。花费30金币获得，附赠朋友圈素材×1。「"减肥的事明天再说吧。"」` },
  { id: "food_5", category: "food", rarity: 1, name: "深夜的大排挡烧烤", emoji: "🍢",
    desc: `小区门口的大排档，仅在22:00后解锁。搭配冰啤酒可触发'追忆往事'状态，持续约40分钟，次日有'宿醉'概率。「"老板，再来10串羊肉串！"」` },
  { id: "food_6", category: "food", rarity: 2, name: "妈妈寄的水果", emoji: "🍎",
    desc: `老家特产水果，每年夏天准时刷新。打开快递触发'想家'buff，附带隐藏任务'给妈妈回个电话'，预计耗时1小时。「"别总点外卖，都是地沟油，多吃水果。"」` },
  { id: "food_7", category: "food", rarity: 2, name: "商场三楼的漂亮饭", emoji: "🍝",
    desc: `周末和朋友约饭的固定节目，排队两小时吃了30分钟，摆盘氛围感+100，但饱腹值存疑。「"服务员，我想核销这个团购套餐"」` },
  { id: "food_8", category: "food", rarity: 3, name: "薛定谔的外卖", emoji: "📦",
    desc: `没试过的新店，评分4.8但评价只有12条。在你打开袋子之前，它同时好吃和不好吃，打开那一刻坍缩为：图片与实物不符。「"避雷这家店！！！"」` },

  // ⚔️ Equipment (★/★★/★★★) — gives coins
  { id: "equip_1", category: "equip", rarity: 1, name: "充电宝·残血版", emoji: "🔋",
    desc: `电量永远显示18%，但每次都能奇迹般再撑两小时。重量相当于半块砖，包里存在感比手机还强。「"你带充电宝了吗？"」` },
  { id: "equip_2", category: "equip", rarity: 1, name: "德劳克AI助手", emoji: "🤖",
    desc: `装备后获得'有问必答'技能。被接住概率100%，附带5%幻觉概率。使用时长越久，越分不清哪些想法是你的，哪些是它的。「"其实这段文案也是AI生成的"」` },
  { id: "equip_3", category: "equip", rarity: 1, name: "万能帆布袋", emoji: "👜",
    desc: `超市购物袋的终极进化形态。容量理论上无限：电脑、外套、水果和三天前忘记拿出来的小票。环保属性+10，整洁度-30。「"不用袋子，我自己带了"」` },
  { id: "equip_4", category: "equip", rarity: 1, name: "晴雨伞·气象对赌版", emoji: "☂️",
    desc: `带它出门必晴天，不带必下雨，已被验证327次。当前状态：正在上一个被遗忘的地方等你去认领。「"算了还是带着吧"」` },
  { id: "equip_5", category: "equip", rarity: 1, name: "保温杯·非养生限定", emoji: "🫖",
    desc: `装备后获得'泡泡看吧！'被动技能。泡枸杞气色+10%，泡咖啡效率+10%，加入冰块温度-10%，三个一起触发'混乱'状态，上厕所概率+10%。「"你知道吗，其实保温杯也能保冷"」` },
  { id: "equip_6", category: "equip", rarity: 2, name: "降噪耳机", emoji: "🎧",
    desc: `装备后进入'请勿打扰'结界，免疫一切社交攻击与环境噪音。副作用：获得"经常耳背"的debuff，需要多次与其他玩家重复交互。「"啊？你刚说什么？"」` },
  { id: "equip_7", category: "equip", rarity: 2, name: "小电驴", emoji: "🛵",
    desc: `移动速度+200%的坐骑装备。通勤、买菜、兜风三合一，车篓里永远有一个来历不明的塑料瓶。电量焦虑程度与手机同步。「"借过借过！"」` },
  { id: "equip_8", category: "equip", rarity: 3, name: "家门口钥匙", emoji: "🔑",
    desc: `在地球Online里，总有一扇门需要钥匙与锁扣来开启。每日副本结束后，使用它即可回到专属休息区。「"终于到家了"」` },

  // 🎫 Coupons (no rarity) — collect 3 for a free spin
  { id: "coupon_1", category: "coupon", rarity: 0, name: "满减凑单券", emoji: "🏷️",
    desc: `使用条件：满3张减30金币。和购物车中的满减一样，你总是凑单的路上。` },
  { id: "coupon_2", category: "coupon", rarity: 0, name: "锦鲤附体券", emoji: "🐟",
    desc: `转发此券到朋友圈无效。仅限地球Online内使用。有效期：直到你集齐三张。` },
  { id: "coupon_3", category: "coupon", rarity: 0, name: "会员积分兑换券", emoji: "💳",
    desc: `恭喜你成为地球Online尊贵会员。权益：无。但这张券是真的。` },
  { id: "coupon_4", category: "coupon", rarity: 0, name: "霸王餐体验券", emoji: "🎟️",
    desc: `免费的东西最贵——但这次是真免费。请放心使用，不会弹出付款页面。` },

  // 📜 Lore (no rarity) — pure collection
  { id: "lore_1", category: "lore", rarity: 0, name: "地球Online小贴士", emoji: "🌍",
    desc: `小贴士：记得喝水。长时间缺水会静默触发'干燥'debuff，且该状态不会弹窗提醒。` },
  { id: "lore_2", category: "lore", rarity: 0, name: "地球Online小贴士", emoji: "🌍",
    desc: `小贴士：主线任务「每日摄入2000大卡+睡眠7h」的优先级始终为SSS级，请保持角色生命值与魔力值状态健康。` },
  { id: "lore_3", category: "lore", rarity: 0, name: "地球Online小贴士", emoji: "🌍",
    desc: `小贴士：请勿在NPC和非必要支线任务上耗费太多时间。` },
  { id: "lore_4", category: "lore", rarity: 0, name: "外卖骑手的祝福", emoji: "📒",
    desc: `祝你用餐愉快。——一个在30分钟内穿越了半个城市的骑手「无论如何，记得好好吃饭」` },
  { id: "lore_5", category: "lore", rarity: 0, name: "便利店的欢迎语", emoji: "📒",
    desc: `欢迎光临。——一个24小时营业便利店的店员「总之，世界上有很多地方常常欢迎你到来」` },
  { id: "lore_6", category: "lore", rarity: 0, name: "茶水间的小道消息", emoji: "🧩",
    desc: `有人小声说"你知道吗，听说要优化"。你假装在等热水，水已经接满了。你还在等。「推开门，摆摆左手，转身右走」` },
  { id: "lore_7", category: "lore", rarity: 0, name: "冷笑话", emoji: "📓",
    desc: `恭喜你抽中冷笑话一则：'什么动物最容易摔倒？''狐狸，因为它狡猾（脚滑）。'「哈哈。」` },
  { id: "lore_8", category: "lore", rarity: 0, name: "玩家观察日志", emoji: "📓",
    desc: `此刻的地球online，有人在书桌前第三次续咖啡，有人登上前往另一个城市的飞机，有人在田野间打理庄稼，有人在日记上写下今天的最后一笔。地球Online自由度极高，无统一攻略，不设唯一通关条件。「请操纵你的角色，多多探索这个世界吧」` },
]

// --- Draw Logic ---
function weightedRandom(weights: Record<string, number>): string {
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let rand = Math.random() * total
  for (const [key, weight] of entries) {
    rand -= weight
    if (rand <= 0) return key
  }
  return entries[entries.length - 1][0]
}

function weightedRandomNumber(weights: Record<number, number>): number {
  const entries = Object.entries(weights).map(([k, v]) => [Number(k), v] as [number, number])
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let rand = Math.random() * total
  for (const [key, weight] of entries) {
    rand -= weight
    if (rand <= 0) return key
  }
  return entries[entries.length - 1][0]
}

export function drawGacha(): GachaResult {
  // Step 1: pick category
  const category = weightedRandom(CATEGORY_WEIGHTS) as GachaItem["category"]

  // Step 2: pick rarity (only for food/equip)
  let candidates: GachaItem[]
  if (category === "food" || category === "equip") {
    const rarity = weightedRandomNumber(RARITY_WEIGHTS)
    candidates = GACHA_ITEMS.filter(i => i.category === category && i.rarity === rarity)
    if (candidates.length === 0) {
      candidates = GACHA_ITEMS.filter(i => i.category === category)
    }
  } else {
    candidates = GACHA_ITEMS.filter(i => i.category === category)
  }

  // Step 3: pick random item from candidates
  const item = candidates[Math.floor(Math.random() * candidates.length)]

  // Step 4: determine reward
  let reward = { xp: 0, coins: 0 }
  if (item.category === "food") {
    reward = { xp: RARITY_XP[item.rarity] || 0, coins: 0 }
  } else if (item.category === "equip") {
    reward = { xp: 0, coins: RARITY_COINS[item.rarity] || 0 }
  }

  return {
    item,
    reward,
    isCoupon: item.category === "coupon",
  }
}

// --- Collection localStorage helpers ---
const COLLECTION_KEY = "earth_online_gacha_collection"
const COUPONS_KEY = "earth_online_gacha_coupons"

export function loadCollection(): CollectionEntry[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(COLLECTION_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveCollection(collection: CollectionEntry[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection)) } catch {}
}

export function loadCoupons(): number {
  if (typeof window === "undefined") return 0
  try {
    const stored = localStorage.getItem(COUPONS_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch { return 0 }
}

export function saveCoupons(count: number): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(COUPONS_KEY, String(count)) } catch {}
}

export function addToCollection(collection: CollectionEntry[], itemId: string): CollectionEntry[] {
  const existing = collection.find(e => e.itemId === itemId)
  if (existing) {
    return collection.map(e => e.itemId === itemId ? { ...e, count: e.count + 1 } : e)
  }
  return [...collection, { itemId, count: 1, firstGotAt: new Date().toISOString() }]
}

export function getItemById(id: string): GachaItem | undefined {
  return GACHA_ITEMS.find(i => i.id === id)
}

export function getRarityStars(rarity: number): string {
  if (rarity === 3) return "★★★"
  if (rarity === 2) return "★★☆"
  if (rarity === 1) return "★☆☆"
  return ""
}

export function getCategoryLabel(category: GachaItem["category"]): string {
  const map = { food: "🍜 食物", equip: "⚔️ 装备", coupon: "🎫 优惠券", lore: "📜 见闻" }
  return map[category]
}

// Split desc into main text and quoted line (「」content displayed on new line)
export function splitDesc(desc: string): { main: string; quote: string | null } {
  const match = desc.match(/^(.*?)「(.+?)」\s*$/)
  if (match) {
    return { main: match[1].trim(), quote: match[2] }
  }
  return { main: desc, quote: null }
}
