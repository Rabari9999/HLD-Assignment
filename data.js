/**
 * data.js — 10,000+ query dataset generator
 *
 * Generates realistic search queries across all major categories.
 * Every query has a count (number of times searched).
 * Format: Array of { query: string, count: number }
 *
 * Strategy: cross-product of subjects × modifiers per category,
 * plus standalone popular queries and how-to / best / near-me patterns.
 */

'use strict';

window.DATASET = (function () {
  const map = new Map(); // lowercase query → count

  /* ── helpers ─────────────────────────────────────────────── */
  function rnd(base) { return Math.round(base * (0.45 + Math.random() * 0.9)); }

  function add(q, c) {
    const k = q.toLowerCase().trim();
    if (k.length < 2) return;
    map.set(k, (map.get(k) || 0) + Math.max(1, Math.round(c)));
  }

  /** Cross every subject with every modifier and add standalone subject too */
  function cross(subjects, mods, base) {
    for (const s of subjects) {
      add(s, rnd(base));
      for (const m of mods) {
        add(`${s} ${m}`, rnd(base * 0.35));
      }
    }
  }

  /* ════════════════════════════════════════════════════════════
     A — APPLE & iPHONE
  ════════════════════════════════════════════════════════════ */
  cross(
    ['iphone 15', 'iphone 15 pro', 'iphone 15 pro max', 'iphone 15 plus',
     'iphone 14', 'iphone 14 pro', 'iphone 14 pro max', 'iphone 13',
     'iphone 13 pro', 'iphone 12', 'iphone se 2024', 'iphone 16',
     'iphone 16 pro', 'iphone 16 pro max'],
    ['price', 'price in india', 'review', 'specifications', 'vs samsung',
     'buy online', 'camera test', 'battery life', 'release date', 'offers',
     'flipkart', 'amazon', 'unboxing', 'tips and tricks', 'wallpaper',
     'case', 'charger', 'back cover', 'screen protector', 'accessories'],
    900000
  );

  cross(
    ['apple watch series 9', 'apple watch ultra 2', 'apple watch se',
     'airpods pro 2', 'airpods max', 'airpods 3', 'macbook pro m3',
     'macbook air m2', 'macbook air m3', 'ipad pro m4', 'ipad air m2',
     'ipad mini 6', 'apple pencil 2', 'apple tv 4k', 'apple music',
     'apple arcade', 'apple one', 'apple card', 'apple vision pro', 'imac'],
    ['price', 'price in india', 'review', 'specifications', 'buy',
     'amazon', 'flipkart', 'offers', 'release date', 'features',
     'battery', 'comparison', 'setup', 'accessories'],
    600000
  );

  /* ════════════════════════════════════════════════════════════
     S — SAMSUNG & ANDROID
  ════════════════════════════════════════════════════════════ */
  cross(
    ['samsung galaxy s24', 'samsung galaxy s24 ultra', 'samsung galaxy s24 plus',
     'samsung galaxy s24 fe', 'samsung galaxy a55', 'samsung galaxy a35',
     'samsung galaxy a15', 'samsung galaxy m55', 'samsung galaxy m35',
     'samsung galaxy f55', 'samsung galaxy z fold 6', 'samsung galaxy z flip 6',
     'samsung galaxy tab s9', 'samsung galaxy tab a9', 'samsung galaxy buds fe',
     'samsung galaxy buds 2 pro', 'samsung neo qled 8k', 'samsung oled tv'],
    ['price', 'price in india', 'review', 'vs iphone', 'specifications',
     'buy online', 'camera', 'battery', 'offers', 'flipkart', 'amazon',
     'launch date', 'unboxing', 'features', 'colors'],
    750000
  );

  /* ════════════════════════════════════════════════════════════
     OTHER PHONES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['oneplus 12', 'oneplus 12r', 'oneplus nord 4', 'google pixel 9',
     'google pixel 9 pro', 'nothing phone 2a', 'nothing phone 3',
     'motorola edge 50 pro', 'vivo v30 pro', 'vivo t3 pro',
     'oppo reno 12 pro', 'oppo find x7', 'realme gt 6', 'realme narzo 70',
     'poco f6 pro', 'poco x6 pro', 'redmi note 13 pro plus', 'redmi 13c',
     'iqoo z9 pro', 'tecno camon 30'],
    ['price', 'price in india', 'review', 'specifications', 'vs iphone',
     'vs samsung', 'camera', 'battery', 'launch date', 'buy online'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     LAPTOPS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['macbook pro m3', 'macbook air m2', 'dell xps 15', 'dell inspiron 15',
     'hp spectre x360', 'hp pavilion 15', 'hp envy 16', 'lenovo thinkpad x1',
     'lenovo ideapad 5', 'asus rog strix g15', 'asus zenbook 14',
     'acer aspire 5', 'acer predator helios', 'msi gaming laptop',
     'razer blade 15', 'surface laptop 5', 'lg gram 16', 'xiaomi book pro',
     'honor magicbook 16', 'redmibook 15'],
    ['price', 'price in india', 'review', 'specifications', 'buy online',
     'under 50000', 'under 1 lakh', 'for gaming', 'for students',
     'battery life', 'weight', 'display quality', 'processor speed'],
    500000
  );

  /* ════════════════════════════════════════════════════════════
     TV, AUDIO, SMART HOME
  ════════════════════════════════════════════════════════════ */
  cross(
    ['sony bravia xr', 'lg oled c3', 'samsung qled q80b', 'mi tv 5x',
     'oneplus tv 55', 'vu cinema tv', 'tcl 4k tv', 'iffalcon tv',
     'sony wh1000xm5', 'bose quietcomfort 45', 'jbl tune 770nc',
     'boat airdopes 141', 'oneplus buds pro 2', 'samsung galaxy buds',
     'apple airpods pro', 'sennheiser hd 560s', 'audio technica m50x',
     'sonos one', 'jbl flip 6', 'boat stone 1000'],
    ['price', 'review', 'buy online', 'specifications', 'india price',
     'deals today', 'amazon', 'flipkart', 'comparison', 'setup guide'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     SOCIAL MEDIA APPS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['instagram', 'whatsapp', 'facebook', 'twitter', 'snapchat',
     'telegram', 'reddit', 'linkedin', 'tiktok', 'pinterest', 'youtube'],
    ['download', 'login', 'not working', 'web', 'apk download',
     'dark mode', 'account hacked', 'delete account', 'new features',
     'privacy settings', 'how to use', 'followers increase',
     'story download', 'reels download', 'profile picture'],
    800000
  );

  cross(
    ['instagram reels', 'instagram story', 'instagram bio ideas',
     'instagram aesthetic', 'instagram filter', 'instagram highlight cover',
     'whatsapp status', 'whatsapp group', 'whatsapp dp', 'whatsapp web'],
    ['download', 'ideas 2024', 'maker', 'tips', 'size', 'free'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     STREAMING
  ════════════════════════════════════════════════════════════ */
  cross(
    ['netflix', 'amazon prime video', 'hotstar disney plus',
     'jiocinema', 'sony liv', 'zee5', 'apple tv plus',
     'spotify', 'youtube music', 'gaana', 'wynk music', 'jiosaavn'],
    ['subscription price', 'login', 'cancel subscription',
     'download offline', 'not working', 'new shows 2024',
     'best movies 2024', 'free trial', 'plans india', 'how to watch'],
    700000
  );

  /* ════════════════════════════════════════════════════════════
     FOOD & RECIPES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['biryani', 'chicken biryani', 'mutton biryani', 'veg biryani',
     'paneer butter masala', 'butter chicken', 'dal makhani', 'chole bhature',
     'pav bhaji', 'aloo paratha', 'masala dosa', 'idli sambar',
     'rajma chawal', 'kadai paneer', 'palak paneer', 'malai kofta',
     'shahi paneer', 'matar paneer', 'aloo gobi', 'aloo mutter',
     'baingan bharta', 'bhindi masala', 'jeera rice', 'dum aloo',
     'gulab jamun', 'rasgulla', 'kheer', 'gajar halwa', 'besan ladoo',
     'sooji halwa', 'samosa', 'pani puri', 'vada pav', 'kachori',
     'dhokla', 'poha', 'upma', 'paratha', 'roti', 'naan',
     'pizza', 'burger', 'pasta carbonara', 'spaghetti bolognese',
     'fried rice', 'noodles', 'maggi masala', 'sandwich', 'club sandwich',
     'chocolate cake', 'red velvet cake', 'muffins', 'cookies', 'brownies',
     'banana bread', 'garlic bread', 'french toast', 'pancakes', 'waffles'],
    ['recipe', 'easy recipe', 'recipe at home', 'restaurant style',
     'recipe in hindi', 'healthy recipe', 'step by step'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     PROGRAMMING LANGUAGES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['python', 'javascript', 'java', 'typescript', 'golang', 'rust',
     'swift', 'kotlin', 'c++', 'c#', 'php', 'ruby', 'scala',
     'dart', 'r programming', 'matlab', 'julia', 'haskell'],
    ['tutorial', 'tutorial for beginners', 'interview questions',
     'cheat sheet', 'projects for beginners', 'online compiler',
     'ide setup', 'best resources', 'crash course', 'documentation',
     'vs java', 'salary 2024', 'roadmap 2024', 'advanced concepts'],
    600000
  );

  /* ════════════════════════════════════════════════════════════
     WEB / MOBILE FRAMEWORKS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['react', 'nextjs', 'vuejs', 'angular', 'svelte', 'sveltekit',
     'nodejs', 'express js', 'fastapi', 'django', 'flask', 'spring boot',
     'laravel', 'rails', 'nestjs', 'nuxtjs', 'remix', 'astro',
     'flutter', 'react native', 'expo', 'ionic'],
    ['tutorial', 'tutorial for beginners', 'interview questions',
     'projects ideas', 'vs react', 'boilerplate', 'best practices',
     'documentation', 'course free', 'crash course 2024'],
    500000
  );

  /* ════════════════════════════════════════════════════════════
     DEVOPS / CLOUD
  ════════════════════════════════════════════════════════════ */
  cross(
    ['docker', 'kubernetes', 'aws', 'google cloud platform', 'azure',
     'terraform', 'ansible', 'jenkins', 'github actions', 'gitlab ci',
     'prometheus', 'grafana', 'elasticsearch', 'nginx', 'linux',
     'github', 'gitlab', 'bitbucket', 'jira', 'confluence'],
    ['tutorial', 'commands cheat sheet', 'interview questions',
     'certification 2024', 'setup guide', 'course free',
     'projects', 'documentation', 'vs', 'best practices'],
    450000
  );

  /* ════════════════════════════════════════════════════════════
     DATABASES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite',
     'cassandra', 'elasticsearch', 'firebase', 'dynamodb', 'neo4j',
     'influxdb', 'mariadb', 'oracle database', 'ms sql server',
     'supabase', 'planetscale', 'cockroachdb'],
    ['tutorial', 'interview questions', 'commands', 'vs mysql',
     'cheat sheet', 'python connection', 'docker setup',
     'performance tuning', 'backup restore', 'indexing'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     ALGORITHMS & DATA STRUCTURES (DSA)
  ════════════════════════════════════════════════════════════ */
  cross(
    ['array problems', 'string problems', 'linked list', 'stack and queue',
     'binary search', 'binary search tree', 'graph bfs dfs',
     'dynamic programming', 'greedy algorithm', 'divide and conquer',
     'sorting algorithms', 'merge sort', 'quick sort', 'heap sort',
     'trie data structure', 'segment tree', 'fenwick tree',
     'disjoint set union', 'topological sort', 'dijkstra algorithm',
     'bellman ford', 'floyd warshall', 'kruskal prim', 'sliding window',
     'two pointer technique', 'backtracking', 'bit manipulation',
     'recursion memoization', 'matrix problems', 'interval problems'],
    ['tutorial', 'interview questions', 'leetcode problems',
     'c++ implementation', 'python implementation', 'examples'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     SYSTEM DESIGN
  ════════════════════════════════════════════════════════════ */
  cross(
    ['system design', 'low level design', 'high level design',
     'design url shortener', 'design twitter', 'design uber',
     'design netflix', 'design whatsapp', 'design instagram',
     'design amazon', 'design youtube', 'design google search',
     'design rate limiter', 'design cache system', 'design notification system',
     'design payment system', 'design ride sharing', 'consistent hashing',
     'cap theorem', 'database sharding', 'load balancing',
     'message queue', 'api gateway', 'microservices vs monolith'],
    ['interview questions', 'explained', 'tutorial', 'primer',
     'examples', 'best resources', 'for beginners'],
    450000
  );

  /* ════════════════════════════════════════════════════════════
     CITIES — INDIA
  ════════════════════════════════════════════════════════════ */
  cross(
    ['delhi', 'mumbai', 'bangalore', 'hyderabad', 'chennai',
     'kolkata', 'pune', 'ahmedabad', 'jaipur', 'surat',
     'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
     'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad',
     'ludhiana', 'agra', 'nashik', 'meerut', 'faridabad',
     'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar'],
    ['weather today', 'news today', 'weather tomorrow',
     'weather this week', 'time', 'map', 'hotels near me',
     'tourist places', 'flights', 'temperature today'],
    200000
  );

  /* ════════════════════════════════════════════════════════════
     CITIES — WORLD
  ════════════════════════════════════════════════════════════ */
  cross(
    ['new york', 'london', 'dubai', 'singapore', 'paris',
     'tokyo', 'sydney', 'toronto', 'berlin', 'amsterdam',
     'bangkok', 'hong kong', 'los angeles', 'chicago', 'san francisco',
     'miami', 'barcelona', 'rome', 'istanbul', 'shanghai',
     'seoul', 'kuala lumpur', 'jakarta', 'cairo', 'johannesburg'],
    ['weather', 'hotels', 'flights', 'tourist places',
     'visa requirements', 'best time to visit',
     'things to do', 'currency', 'map', 'food guide'],
    250000
  );

  /* ════════════════════════════════════════════════════════════
     TRAVEL — INDIA DESTINATIONS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['goa', 'kashmir', 'kerala', 'manali', 'shimla',
     'ooty', 'munnar', 'coorg', 'rishikesh', 'varanasi',
     'jaisalmer', 'udaipur', 'darjeeling', 'andaman nicobar',
     'leh ladakh', 'spiti valley', 'kodaikanal', 'lonavala',
     'mahabaleshwar', 'mussoorie'],
    ['trip plan', 'tourist places', 'best time to visit',
     'budget trip', 'hotels', 'packages', 'itinerary',
     'how to reach', 'things to do', 'travel guide'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     TRAVEL — INTERNATIONAL
  ════════════════════════════════════════════════════════════ */
  cross(
    ['maldives', 'bali', 'thailand', 'dubai', 'singapore',
     'europe trip', 'usa visa', 'australia', 'canada',
     'switzerland', 'new zealand', 'japan', 'south korea',
     'turkey', 'greece', 'sri lanka', 'nepal', 'bhutan', 'vietnam'],
    ['trip cost from india', 'visa requirements for indians',
     'best time to visit', 'itinerary', 'packages price',
     'hotels', 'flights from india', 'tourist spots', 'budget'],
    280000
  );

  /* ════════════════════════════════════════════════════════════
     HEALTH — CONDITIONS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['diabetes', 'high blood pressure', 'high cholesterol',
     'thyroid problem', 'heart disease', 'asthma', 'arthritis',
     'back pain', 'neck pain', 'knee pain', 'migraine',
     'anxiety disorder', 'depression', 'insomnia', 'obesity',
     'anemia', 'vitamin d deficiency', 'vitamin b12 deficiency',
     'iron deficiency', 'kidney stones', 'fatty liver',
     'pcos', 'fibromyalgia', 'hypothyroidism', 'hyperthyroidism'],
    ['symptoms', 'treatment', 'home remedies', 'diet plan',
     'medicines', 'causes', 'early signs', 'prevention',
     'exercise', 'foods to avoid'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     HEALTH — FITNESS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['weight loss', 'muscle building', 'yoga for beginners',
     'running for beginners', 'cycling benefits', 'swimming tips',
     'gym workout plan', 'home workout', 'cardio exercises',
     'strength training', 'hiit workout', 'pilates exercises',
     'zumba dance', 'crossfit workout', 'intermittent fasting',
     'keto diet', 'vegan diet', 'mediterranean diet'],
    ['tips', 'plan for beginners', 'for weight loss',
     'routine', 'diet plan', 'mistakes to avoid',
     'benefits', 'how to start', 'schedule'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     FINANCE — STOCKS & CRYPTO
  ════════════════════════════════════════════════════════════ */
  cross(
    ['bitcoin', 'ethereum', 'dogecoin', 'shiba inu', 'solana',
     'cardano', 'polygon matic', 'binance coin', 'ripple xrp',
     'nifty 50', 'sensex today', 'gold price', 'silver price',
     'reliance industries', 'tata consultancy services',
     'infosys', 'hdfc bank', 'icici bank', 'sbi shares',
     'adani enterprises', 'bajaj finance', 'axis bank',
     'kotak mahindra bank', 'larsen and toubro', 'wipro'],
    ['price today', 'share price', 'live price', 'price chart',
     'buy or sell', 'target price', 'analysis', 'news today',
     'dividend history', 'how to invest'],
    500000
  );

  /* ════════════════════════════════════════════════════════════
     FINANCE — PERSONAL
  ════════════════════════════════════════════════════════════ */
  cross(
    ['mutual fund sip', 'index fund', 'elss fund', 'ppf account',
     'nps national pension', 'fixed deposit', 'recurring deposit',
     'gold etf', 'sovereign gold bond', 'real estate investment',
     'home loan', 'personal loan', 'car loan', 'education loan',
     'credit card', 'emi calculator', 'income tax calculator',
     'gst calculator', 'sip calculator', 'rd calculator'],
    ['how to start', 'best options 2024', 'returns calculator',
     'tax benefits', 'for beginners', 'calculator',
     'risk factors', 'comparison', 'hdfc', 'sbi', 'icici'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     BANKING & FINTECH
  ════════════════════════════════════════════════════════════ */
  cross(
    ['sbi net banking', 'hdfc net banking', 'icici net banking',
     'axis bank', 'kotak 811', 'paytm', 'phonepe', 'gpay',
     'amazon pay', 'mobikwik', 'upi payment', 'neft transfer',
     'rtgs transfer', 'ifsc code', 'micr code'],
    ['login', 'registration', 'not working fix', 'how to use',
     'charges', 'limit per day', 'apply online',
     'customer care number', 'status check', 'forgot password'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     EDUCATION — EXAMS
  ════════════════════════════════════════════════════════════ */
  cross(
    ['upsc civil services', 'gate exam', 'jee mains', 'jee advanced',
     'neet ug', 'neet pg', 'cat mba exam', 'gmat', 'gre',
     'ielts', 'toefl', 'ssc cgl', 'ssc chsl', 'ibps po',
     'ibps clerk', 'rrb ntpc', 'rrb je', 'ctet', 'nda exam',
     'cuet ug', 'clat law', 'aiims mbbs', 'xat exam'],
    ['syllabus 2024', 'preparation tips', 'books list',
     'previous year papers', 'mock test free', 'coaching online',
     'eligibility criteria', 'exam date 2024',
     'result 2024', 'cut off marks'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     EDUCATION — ONLINE LEARNING
  ════════════════════════════════════════════════════════════ */
  cross(
    ['coursera', 'udemy', 'edx', 'skillshare', 'pluralsight',
     'linkedin learning', 'nptel courses', 'swayam', 'khan academy',
     'unacademy', 'byjus', 'vedantu', 'coding ninjas', 'scaler',
     'great learning', 'simplilearn', 'intellipaat'],
    ['free courses', 'best courses 2024', 'discount coupon',
     'review', 'vs', 'data science', 'machine learning',
     'programming course', 'certificate course', 'refund policy'],
    250000
  );

  /* ════════════════════════════════════════════════════════════
     SPORTS — CRICKET
  ════════════════════════════════════════════════════════════ */
  cross(
    ['virat kohli', 'rohit sharma', 'ms dhoni', 'sachin tendulkar',
     'jasprit bumrah', 'hardik pandya', 'shubman gill',
     'yashasvi jaiswal', 'kl rahul', 'rishabh pant',
     'suryakumar yadav', 'ravindra jadeja', 'ravichandran ashwin',
     'shreyas iyer', 'ishan kishan'],
    ['century records', 'stats', 'latest news', 'ipl team 2024',
     'net worth', 'age career', 'wife family', 'instagram',
     'records broken', 'odi career stats'],
    400000
  );

  cross(
    ['ipl 2024', 'ipl 2025', 'world cup t20 2024', 'world cup odi',
     'champions trophy', 'asia cup', 'test championship',
     'csk vs mi', 'rcb vs kkr', 'ipl points table'],
    ['schedule', 'live score', 'points table', 'tickets buy',
     'live streaming', 'highlights', 'winner prediction',
     'squads players', 'analysis', 'ott channel'],
    450000
  );

  /* ════════════════════════════════════════════════════════════
     SPORTS — FOOTBALL
  ════════════════════════════════════════════════════════════ */
  cross(
    ['cristiano ronaldo', 'lionel messi', 'kylian mbappe',
     'neymar jr', 'erling haaland', 'vinicius jr', 'lamine yamal',
     'jude bellingham', 'pedri', 'gavi',
     'real madrid', 'barcelona', 'manchester city', 'liverpool',
     'psg paris', 'chelsea fc', 'arsenal', 'manchester united',
     'premier league', 'la liga', 'champions league', 'euro 2024',
     'copa america', 'fifa world cup 2026', 'bundes liga'],
    ['news today', 'score today', 'match today',
     'schedule fixtures', 'standings table', 'highlights video',
     'transfer news', 'squad players', 'goals scored', 'stats records'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     ENTERTAINMENT — BOLLYWOOD
  ════════════════════════════════════════════════════════════ */
  cross(
    ['shah rukh khan', 'salman khan', 'aamir khan', 'ranveer singh',
     'ranbir kapoor', 'hrithik roshan', 'akshay kumar', 'tiger shroff',
     'deepika padukone', 'alia bhatt', 'priyanka chopra',
     'katrina kaif', 'kareena kapoor', 'anushka sharma',
     'shraddha kapoor', 'disha patani'],
    ['movies list', 'latest news', 'age', 'net worth',
     'upcoming movie', 'instagram', 'salary', 'wife husband',
     'hit movies', 'box office collection'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     ENTERTAINMENT — MOVIES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['jawan', 'pathaan', 'animal movie', 'dunki', 'kgf chapter 3',
     'pushpa 2 the rule', 'kalki 2898 ad', 'stree 2', 'singham again',
     'tiger 3', 'war 2', 'avengers secret wars', 'deadpool wolverine',
     'joker 2', 'inside out 2', 'moana 2', 'captain america brave new world',
     'fantastic four 2025', 'thunderbolts', 'dune 2',
     'oppenheimer', 'barbie movie', 'killers flower moon',
     'poor things', 'anatomy of a fall'],
    ['review', 'box office collection', 'trailer', 'cast',
     'release date', 'ott platform', 'story explained',
     'rating imdb', 'download', 'watch online free'],
    500000
  );

  /* ════════════════════════════════════════════════════════════
     ENTERTAINMENT — WEB SERIES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['squid game season 2', 'money heist season 6', 'stranger things 5',
     'wednesday season 2', 'emily in paris season 4',
     'mirzapur season 3', 'panchayat season 3', 'scam 1992',
     'family man season 3', 'delhi crime', 'aspirants 2',
     'kota factory season 3', 'dark season 4', 'elite season 7',
     'black mirror season 7', 'bridgerton season 3'],
    ['review', 'release date', 'episodes list', 'cast',
     'trailer', 'netflix', 'prime video', 'download', 'story', 'rating'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     CARS — INDIA
  ════════════════════════════════════════════════════════════ */
  cross(
    ['tata nexon', 'tata punch', 'tata altroz', 'tata harrier',
     'tata safari', 'hyundai creta', 'hyundai venue', 'hyundai alcazar',
     'kia seltos', 'kia sonet', 'maruti baleno', 'maruti swift',
     'maruti brezza', 'maruti ertiga', 'honda city',
     'toyota fortuner', 'toyota innova hycross', 'mahindra scorpio n',
     'mahindra xuv700', 'mg hector',
     'volkswagen taigun', 'skoda slavia', 'renault kwid'],
    ['price on road', 'review 2024', 'mileage kmpl', 'emi calculator',
     'booking online', 'colors available', 'variants comparison',
     'specifications', 'vs hyundai creta', 'vs tata nexon',
     'launch date india', 'waiting period'],
    400000
  );

  /* ════════════════════════════════════════════════════════════
     ELECTRIC VEHICLES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['tata nexon ev', 'tata tiago ev', 'tata punch ev',
     'hyundai ioniq 5', 'kia ev6', 'mg zs ev', 'ola electric s1 pro',
     'ather 450x', 'bajaj chetak electric', 'tvs iqube',
     'hero vida v1 pro', 'simple one scooter', 'pure ev ecotron',
     'bmw ix', 'audi e tron', 'tesla model 3'],
    ['price india', 'range km', 'charging time', 'review',
     'government subsidy', 'book online', 'comparison',
     'cheapest ev', 'best ev 2024', 'pros cons'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     FASHION & SHOPPING
  ════════════════════════════════════════════════════════════ */
  cross(
    ['myntra', 'flipkart', 'amazon india', 'meesho', 'nykaa',
     'ajio', 'zara india', 'h and m', 'uniqlo india', 'nike india',
     'adidas india', 'puma india', 'reebok india', 'levi jeans',
     'peter england shirts'],
    ['sale 2024', 'offers today', 'coupon code', 'discount',
     'app download', 'return policy', 'new arrivals', 'best sellers',
     'cash on delivery', 'customer care'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     BEAUTY & SKINCARE
  ════════════════════════════════════════════════════════════ */
  cross(
    ['vitamin c serum', 'retinol cream', 'hyaluronic acid serum',
     'niacinamide serum', 'spf sunscreen', 'face wash', 'toner',
     'moisturizer', 'under eye cream', 'lip balm', 'hair oil',
     'hair serum', 'shampoo for hair fall', 'conditioner',
     'face pack', 'charcoal mask', 'sheet mask'],
    ['best for oily skin', 'best for dry skin', 'india price',
     'review', 'how to use', 'benefits', 'side effects',
     'drugstore', 'amazon', 'nykaa'],
    250000
  );

  /* ════════════════════════════════════════════════════════════
     GAMING
  ════════════════════════════════════════════════════════════ */
  cross(
    ['bgmi battlegrounds', 'free fire max', 'call of duty mobile',
     'minecraft java', 'fortnite chapter 5', 'valorant',
     'gta 5 online', 'gta 6', 'elden ring dlc', 'cyberpunk 2077',
     'red dead redemption 2', 'the witcher 3', 'god of war ragnarok',
     'spider-man 2 ps5', 'hogwarts legacy', 'baldurs gate 3',
     'alan wake 2', 'starfield', 'diablo 4', 'world of warcraft'],
    ['download pc', 'tips tricks', 'how to play', 'best settings',
     'gameplay walkthrough', 'system requirements',
     'release date', 'cheats codes', 'characters guide', 'review'],
    400000
  );

  cross(
    ['playstation 5', 'xbox series x', 'nintendo switch oled',
     'steam deck', 'gaming laptop under 60000', 'gaming pc build 50000',
     'gaming monitor 144hz', 'gaming chair india', 'gaming headset',
     'gaming mouse', 'mechanical keyboard gaming'],
    ['price india', 'buy india', 'review 2024', 'specifications',
     'best games list', 'setup guide', 'vs comparison', 'availability'],
    350000
  );

  /* ════════════════════════════════════════════════════════════
     JOBS & CAREER
  ════════════════════════════════════════════════════════════ */
  cross(
    ['software engineer salary', 'data scientist salary',
     'product manager salary', 'ux designer salary',
     'fresher jobs 2024', 'jobs in google', 'jobs in amazon',
     'jobs in microsoft', 'jobs in tcs', 'jobs in infosys',
     'jobs in wipro', 'jobs in accenture', 'work from home jobs',
     'remote jobs india', 'freelance jobs online',
     'internship 2024', 'campus placement tips'],
    ['for freshers', 'how to get', 'salary package',
     'skills required', 'apply online', 'interview questions',
     'eligibility', '2024 openings'],
    280000
  );

  /* ════════════════════════════════════════════════════════════
     GOVERNMENT SERVICES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['passport apply online', 'aadhar card update', 'pan card apply',
     'driving licence online', 'vehicle registration', 'voter id card',
     'ration card', 'birth certificate', 'income certificate',
     'caste certificate', 'domicile certificate', 'epf balance check',
     'esi card', 'digilocker app', 'umang app'],
    ['how to apply', 'documents required', 'fees', 'status check',
     'online process', 'time taken', 'customer care', 'correction'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     MUSIC
  ════════════════════════════════════════════════════════════ */
  cross(
    ['arijit singh', 'shreya ghoshal', 'atif aslam', 'jubin nautiyal',
     'neha kakkar', 'yo yo honey singh', 'badshah', 'diljit dosanjh',
     'taylor swift', 'ed sheeran', 'the weeknd', 'drake',
     'billie eilish', 'ariana grande', 'bts kpop'],
    ['new song 2024', 'best songs', 'top songs', 'songs list',
     'live concert', 'instagram', 'age', 'net worth'],
    300000
  );

  /* ════════════════════════════════════════════════════════════
     GOOGLE SERVICES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['google maps', 'gmail', 'google drive', 'google docs',
     'google sheets', 'google slides', 'google forms',
     'google meet', 'google classroom', 'google photos',
     'google pay', 'google chrome', 'google translate',
     'google search console', 'google analytics', 'google ads'],
    ['login', 'download', 'not working fix', 'tutorial',
     'shortcuts', 'offline mode', 'dark mode', 'storage plan',
     'share', 'tips and tricks'],
    600000
  );

  /* ════════════════════════════════════════════════════════════
     MICROSOFT SERVICES
  ════════════════════════════════════════════════════════════ */
  cross(
    ['microsoft word', 'microsoft excel', 'microsoft powerpoint',
     'microsoft teams', 'microsoft outlook', 'microsoft edge',
     'windows 11', 'windows 10', 'microsoft 365', 'visual studio code',
     'github copilot', 'chatgpt', 'bing ai', 'copilot ai', 'azure'],
    ['download free', 'tutorial', 'shortcuts', 'not working',
     'login', 'tips', 'student version', 'installation guide', 'update'],
    500000
  );

  /* ════════════════════════════════════════════════════════════
     FESTIVALS
  ════════════════════════════════════════════════════════════ */
  const festivals = [
    'diwali', 'holi', 'eid ul fitr', 'christmas', 'navratri',
    'durga puja', 'ganesh chaturthi', 'onam', 'baisakhi', 'pongal',
    'dussehra', 'raksha bandhan', 'janmashtami', 'maha shivratri',
    'ram navami', 'guru nanak jayanti', 'karva chauth', 'lohri',
    'bihu', 'ugadi'
  ];
  for (const f of festivals) {
    add(f + ' 2024', rnd(500000));
    add(f + ' wishes', rnd(400000));
    add(f + ' date 2024', rnd(350000));
    add(f + ' images download', rnd(300000));
    add(f + ' special recipe', rnd(250000));
    add(f + ' decoration ideas', rnd(200000));
    add(f + ' status whatsapp', rnd(180000));
  }

  /* ════════════════════════════════════════════════════════════
     HOW TO — 100 TOPICS × 5 VARIANTS
  ════════════════════════════════════════════════════════════ */
  const howToTopics = [
    'make money online', 'start a blog', 'lose weight fast',
    'gain muscle at home', 'meditate for beginners', 'sleep better at night',
    'improve memory', 'learn programming from scratch', 'learn english fluently',
    'speak english confidently', 'invest in stock market india',
    'invest in mutual funds sip', 'save money every month',
    'make a monthly budget', 'start a business in india',
    'write a resume for fresher', 'crack software interview',
    'get job in google', 'study abroad from india', 'apply for scholarship',
    'apply for passport india', 'apply for visa usa',
    'get pan card online', 'link aadhar to pan card',
    'file income tax return online', 'get driving licence india',
    'buy health insurance', 'buy term life insurance',
    'get home loan', 'close credit card',
    'cook rice perfectly', 'make masala tea', 'make filter coffee',
    'bake bread without yeast', 'make pizza at home without oven',
    'bake cake without oven', 'make paneer at home',
    'reduce belly fat quickly', 'do yoga at home for beginners',
    'run faster without getting tired', 'fix a cracked phone screen',
    'speed up slow laptop', 'remove virus from windows pc',
    'reset router password', 'extend wifi range at home',
    'recover deleted photos from android', 'create youtube channel',
    'earn money from youtube', 'grow instagram followers organically',
    'get blue tick on instagram', 'write a professional email',
    'write a cover letter', 'prepare for group discussion',
    'prepare for hr interview', 'negotiate salary fresher',
    'work from home productively', 'tie a tie step by step',
    'iron clothes properly', 'remove stains from clothes',
    'pack light for trip', 'travel europe on budget',
    'get free lounge access credit card', 'apply for travel insurance',
    'get rid of pimples overnight', 'get clear glowing skin naturally',
    'remove dark circles permanently', 'grow hair faster in a month',
    'stop hair fall immediately', 'whiten teeth at home naturally',
    'lose 10 kg in 30 days', 'build six pack abs at home',
    'gain weight for skinny guys', 'increase height after 18',
    'be more productive at work', 'manage time effectively',
    'stop procrastinating now', 'focus while studying',
    'deal with workplace stress', 'overcome social anxiety',
    'make new friends as adult', 'improve communication skills',
    'become more confident', 'develop leadership skills',
    'improve handwriting quickly', 'draw for absolute beginners',
    'learn guitar from scratch', 'learn piano at home',
    'learn classical dance', 'learn swimming as adult',
    'learn to drive car', 'learn photography with phone',
    'edit photos on mobile', 'make reels for instagram',
    'record podcast at home', 'set up home studio recording',
    'build a website free', 'create mobile app no code',
    'make money with ai tools', 'use chatgpt effectively'
  ];
  for (const t of howToTopics) {
    add(`how to ${t}`, rnd(200000));
    add(`how to ${t} at home`, rnd(150000));
    add(`how to ${t} fast`, rnd(120000));
    add(`how to ${t} for beginners`, rnd(100000));
    add(`how to ${t} step by step`, rnd(90000));
  }

  /* ════════════════════════════════════════════════════════════
     BEST / TOP
  ════════════════════════════════════════════════════════════ */
  const bestTopics = [
    'mobile under 15000 india', 'mobile under 20000 india',
    'mobile under 30000 india', 'laptop for students india',
    'laptop for programming', 'gaming laptop under 70000',
    'headphones under 2000', 'earbuds under 3000 india',
    'smartwatch under 5000', 'smart tv 43 inch india',
    'smart tv 55 inch india', 'refrigerator double door',
    'washing machine front load', 'air conditioner 1.5 ton',
    'water purifier india', 'air purifier india',
    'programming language to learn 2024', 'frontend framework 2024',
    'backend framework for api', 'cloud provider for startup',
    'mutual fund sip 2024', 'elss tax saving fund',
    'small cap fund india', 'large cap fund india',
    'credit card for beginners india', 'zero fee credit card',
    'restaurant in mumbai', 'cafe in bangalore', 'hotel in goa',
    'resort in kerala', 'hill station near delhi',
    'diet plan for weight loss female', 'protein powder for gym beginners',
    'multivitamin for men india', 'supplement for hair growth',
    'series on netflix india 2024', 'movies on amazon prime india',
    'shows on hotstar 2024', 'anime to watch on crunchyroll',
    'documentary on youtube free', 'places to visit in india 2024',
    'budget international trip from india', 'solo travel destination',
    'honeymoon destination india domestic', 'family trip destination near mumbai'
  ];
  for (const t of bestTopics) {
    add(`best ${t}`, rnd(300000));
    add(`top 10 ${t}`, rnd(250000));
    add(`top 5 ${t}`, rnd(220000));
  }

  /* ════════════════════════════════════════════════════════════
     NEAR ME
  ════════════════════════════════════════════════════════════ */
  const nearMeItems = [
    'restaurant', 'cafe', 'hospital', 'pharmacy', 'petrol pump',
    'atm', 'gym', 'yoga class', 'swimming pool', 'park',
    'cinema hall', 'school', 'college', 'coaching center', 'salon',
    'spa', 'hotel', 'supermarket', 'hardware store', 'mechanic',
    'plumber', 'electrician', 'dentist', 'eye doctor', 'bank branch'
  ];
  for (const item of nearMeItems) {
    add(`${item} near me`, rnd(500000));
    add(`best ${item} near me`, rnd(350000));
    add(`${item} near me open now`, rnd(300000));
    add(`cheap ${item} near me`, rnd(200000));
  }

  /* ════════════════════════════════════════════════════════════
     WEATHER
  ════════════════════════════════════════════════════════════ */
  add('weather today', 8000000);
  add('weather tomorrow', 7000000);
  add('weather this week', 5000000);
  add('weather forecast 10 days', 4000000);
  const weatherPlaces = [
    'delhi', 'mumbai', 'bangalore', 'hyderabad', 'chennai', 'kolkata',
    'pune', 'jaipur', 'ahmedabad', 'lucknow', 'new york', 'london',
    'dubai', 'singapore', 'paris', 'tokyo', 'sydney', 'toronto', 'berlin'
  ];
  for (const p of weatherPlaces) {
    add(`${p} weather today`, rnd(600000));
    add(`${p} weather tomorrow`, rnd(500000));
    add(`${p} weather this week`, rnd(400000));
    add(`weather in ${p}`, rnd(550000));
  }

  /* ════════════════════════════════════════════════════════════
     NEWS
  ════════════════════════════════════════════════════════════ */
  add('news today', 7000000);
  add('news in hindi', 5000000);
  add('latest news india today', 4500000);
  add('breaking news live', 4000000);
  add('cricket news today', 3500000);
  add('sports news today', 3000000);
  add('bollywood news today', 2500000);
  add('stock market news today', 2000000);
  add('technology news today', 1800000);
  add('world news today', 1600000);
  add('business news today', 1400000);
  add('political news today', 1200000);

  /* ════════════════════════════════════════════════════════════
     MISCELLANEOUS POPULAR QUERIES
  ════════════════════════════════════════════════════════════ */
  const misc = [
    ['youtube', 6000000], ['facebook', 5500000], ['google', 5000000],
    ['amazon', 4800000], ['flipkart', 4200000], ['instagram login', 4000000],
    ['whatsapp web', 3800000], ['netflix login', 3600000],
    ['gmail login', 3400000], ['paytm', 3200000],
    ['phonepe download', 3000000], ['zomato', 2800000],
    ['swiggy order food', 2600000], ['ola cab book', 2400000],
    ['uber india', 2200000], ['maps google', 2000000],
    ['translate english to hindi', 1800000], ['dictionary meaning', 1600000],
    ['calculator online', 1500000], ['pdf to word converter', 1400000],
    ['compress pdf online', 1300000], ['image to text converter', 1200000],
    ['qr code generator free', 1100000], ['resume maker free', 1000000],
    ['logo maker free', 950000], ['video editor online free', 900000],
    ['photo editor online', 850000], ['background remover free', 800000],
    ['grammar checker online', 750000], ['plagiarism checker free', 700000],
    ['word to pdf', 650000], ['excel formulas list', 620000],
    ['powerpoint templates free', 580000], ['free stock photos', 550000],
    ['screen recorder free', 520000], ['vpn free india', 490000],
    ['wifi password show android', 460000], ['dark mode youtube', 430000],
    ['youtube ad free', 400000], ['jee rank predictor', 380000],
    ['neet rank predictor', 360000], ['salary calculator india', 340000],
    ['bmi calculator online', 320000], ['calorie calculator food', 300000],
    ['period tracker app', 280000], ['pregnancy week calculator', 260000],
    ['baby name generator', 240000], ['numerology calculator', 220000],
    ['astrology today', 200000], ['horoscope today hindi', 190000]
  ];
  for (const [q, c] of misc) add(q, c);

  /* ════════════════════════════════════════════════════════════
     QUOTES
  ════════════════════════════════════════════════════════════ */
  const quoteSources = [
    'motivational quotes', 'love quotes', 'life quotes', 'sad quotes',
    'friendship quotes', 'success quotes', 'morning quotes',
    'good night quotes', 'birthday quotes', 'anniversary quotes',
    'attitude quotes', 'funny quotes', 'quotes about happiness',
    'quotes about change', 'quotes about strength'
  ];
  for (const q of quoteSources) {
    add(q, rnd(300000));
    add(`${q} in hindi`, rnd(250000));
    add(`${q} in english`, rnd(200000));
    add(`${q} for whatsapp`, rnd(180000));
  }

  /* ── final export ─────────────────────────────────────────── */
  const result = Array.from(map.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count);

  console.log(`[Dataset] Generated ${result.length} unique queries.`);
  return result;
})();
