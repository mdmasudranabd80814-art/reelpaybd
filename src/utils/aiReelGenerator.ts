import { Reel } from '../types';
import {
  DEFAULT_MASUD_CREATOR,
  MasudRanaCreatorIdentity,
} from './reelOwner';

export type ContentCategory =
  | 'কমেডি'
  | 'শর্ট ড্রামা'
  | 'শর্ট মুভি'
  | 'গান'
  | 'বিনোদন'
  | 'ট্রেন্ডিং'
  | 'গেমিং'
  | 'রান্না'
  | 'শিক্ষা';

export const ALL_CONTENT_CATEGORIES: ContentCategory[] = [
  'কমেডি',
  'শর্ট ড্রামা',
  'শর্ট মুভি',
  'গান',
  'বিনোদন',
  'ট্রেন্ডিং',
  'গেমিং',
  'রান্না',
  'শিক্ষা',
];

interface AiSceneTemplate {
  titles: string[];
  captions: string[];
  hashtags: string[];
  audioTracks: string[];
  videos: string[];
  images: string[];
  pointsReward: number;
}

const AI_CATEGORY_TEMPLATES: Record<ContentCategory, AiSceneTemplate> = {
  কমেডি: {
    titles: [
      'কমেডিয়ান স্টেজ শো: বাংলার সেরা হাসির স্ট্যান্ডআপ (৩০ সেকেন্ড) 🎭😂',
      'গ্রামের চায়ের আড্ডা কমেডি: চাচা-ভাতিজার মজার কাণ্ড ☕🤣',
      'চায়ের দোকানে বন্ধুদের ১০ টাকার হিসাব নিয়ে মহা-তর্ক 😂☕',
      'বস যখন বিড়ালের চেহারায় মিটিং নেয়! অফিস কমেডি 😹💼',
      'ঢাকার রাস্তায় রিকশা ভাড়া আর অতিরিক্ত শপিং-এর মজার কাণ্ড 🛺🤣',
      'গলির ক্রিকেটে সুপারম্যান ক্যাচ ধরতে গিয়ে যা ঘটলো! 🏏😂',
      'স্ট্যান্ডআপ কমেডি: মেসের রান্না বনাম মায়ের হাতের খাবার 🎤🤣',
      'অনলাইন শপিং-এ ছবি দেখে যা অর্ডার দিলাম বনাম যা পেলাম 📦🤣',
      'সেলুনে গিয়ে "একটু ছোট করে দেন" বলার ভয়াবহ ফলাফল ✂️😂',
      'বিয়ের দাওয়াতে রোস্টের প্লেট নিয়ে গোপন যুদ্ধ 🍗🤣',
    ],
    captions: [
      'মাসুদ রানার ৩০ সেকেন্ডের স্পেশাল AI কমেডিয়ান রিল! গানের তালে হাসতে হাসতে পেট ব্যথা হবে 😂🔥',
      'প্রতিদিন এমন ফানি বাংলা কমেডি ও আড্ডার ভিডিও দেখতে ফলো করে রাখুন! 🤣✨',
      'বন্ধুদের ট্যাগ করুন যাদের সাথে ঠিক এমন মজার ঘটনা ঘটেছে! 🎭😂',
    ],
    hashtags: ['#কমেডি', '#ComedianBD', '#MasudRana', '#Funny30s', '#হাসিরভিডিও'],
    audioTracks: [
      'কমেডিয়ান স্টেজ মিউজিক ও রিদম (৩০ সেকেন্ড) - মাসুদ রানা',
      'ফানি বাংলা আড্ডা মিউজিক বিট - AI স্টুডিও',
      'হাসির মিউজিক্যাল শো - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_comedian_stage.mp4',
      '/videos/ai_comedian_village.mp4',
      '/videos/ai_comedy_tea_stall.mp4',
      '/videos/ai_comedy_standup.mp4',
      '/videos/ai_comedy_cat_boss.mp4',
      '/videos/ai_comedy_rickshaw.mp4',
      '/videos/ai_comedy_cricket.mp4',
    ],
    images: [
      '/images/ai_comedian_stage.jpg',
      '/images/ai_comedian_village.jpg',
      '/images/ai_comedy_tea_stall.jpg',
      '/images/ai_comedy_standup.jpg',
      '/images/ai_comedy_cat_boss.jpg',
      '/images/ai_comedy_rickshaw.jpg',
      '/images/ai_comedy_cricket.jpg',
    ],
    pointsReward: 15,
  },
  'শর্ট ড্রামা': {
    titles: [
      'বৃষ্টির রাতে দেখা • ৩০ সেকেন্ডের আবেগঘন শর্ট ড্রামা 🎬🌧️',
      'ক্যাম্পাসের শেষ বিকেল • বন্ধুত্ব ও ভালোবাসার শর্ট ড্রামা 🎬✨',
      'শেষ চিঠি ও না বলা কথা • বাংলা শর্ট ড্রামা (পর্ব) 💔🌧️',
      'অপেক্ষার প্রহর • ঢাকার সন্ধ্যার রোমান্টিক শর্ট নাটক ☕❤️',
      'মায়ের হাসির জন্য সংগ্রাম • হৃদয়ছোঁয়া ৩০ সেকেন্ডের ড্রামা 🎭💫',
      'পুরোনো ডায়েরির পাতা থেকে • মিনি শর্ট ড্রামা 📖🎬',
    ],
    captions: [
      '৩০ সেকেন্ডের হৃদয়স্পর্শী শর্ট ড্রামা ও ব্যাকগ্রাউন্ড মিউজিক — মাসুদ রানার AI স্টুডিও থেকে! 🎬❤️',
      'বৃষ্টি আর গানের সুরে জমে ওঠা দারুণ একটি মিনি নাটক! শেষ পর্যন্ত দেখুন ✨🌧️',
      'আপনার প্রিয় মুহূর্তটি কোনটি ছিল? কমেন্টে জানান! 🎭💬',
    ],
    hashtags: ['#শর্টড্রামা', '#BanglaDrama', '#MasudRana', '#30SecDrama', '#ReelPayBD'],
    audioTracks: [
      'বৃষ্টিস্নাত শর্ট ড্রামা থিম (সুর ও গিটার) - মাসুদ রানা',
      'ক্যাম্পাস ইভিনিং অ্যাকোস্টিক ড্রামা মিউজিক',
      'হৃদয়ছোঁয়া বাংলা নাটক সাউন্ডট্র্যাক - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_drama_rain.mp4',
      '/videos/ai_drama_campus.mp4',
    ],
    images: [
      '/images/ai_drama_rain.jpg',
      '/images/ai_drama_campus.jpg',
    ],
    pointsReward: 20,
  },
  'শর্ট মুভি': {
    titles: [
      'অন্ধকার গলির রহস্য • থ্রিলার শর্ট মুভি (৩০ সেকেন্ড) 🎥🕵️',
      'ব্রিজের ওপারে মিশন • অ্যাকশন ও সাসপেন্স শর্ট মুভি 🎥🔥',
      'মধ্যরাতের টেলিফোন কল • ক্রাইম মিস্ট্রি মিনি মুভি 📞⚡',
      'শেষ ট্রেনের যাত্রী • সিনেম্যাটিক শর্ট ফিল্ম 🚆🎬',
      'নিওন শহরের ছায়া • ৩০ সেকেন্ডের ডিটেকটিভ শর্ট মুভি 🌃🕶️',
      'গোপন ফাইল নং ৭ • রুদ্ধশ্বাস বাংলা মিনি সিনেমা 📂🔥',
    ],
    captions: [
      'সিনেমাটিক আবহ ও থ্রিলার মিউজিকে তৈরি ৩০ সেকেন্ডের শর্ট মুভি! 🎥⚡ মাসুদ রানার অফিসিয়াল ফিড।',
      'হলিউড স্টাইল কালার গ্রেডিং আর সাসপেন্স মিউজিকে বাংলা শর্ট ফিল্ম! 🕵️🔥',
      'পরবর্তী পর্ব দেখতে চাইলে ভিডিওতে ডাবল ট্যাপ করে লাইক দিন! ❤️🎬',
    ],
    hashtags: ['#শর্টমুভি', '#ShortFilmBD', '#ThrillerMovie', '#MasudRana', '#Cinema30s'],
    audioTracks: [
      'সিনেম্যাটিক থ্রিলার শর্ট মুভি স্কোর - মাসুদ রানা',
      'অ্যাকশন সাসপেন্স ব্যাকগ্রাউন্ড মিউজিক (৩০ সেকেন্ড)',
      'মিস্ট্রি ফিল্ম সাউন্ড ডিজাইন - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_movie_detective.mp4',
      '/videos/ai_movie_hero.mp4',
    ],
    images: [
      '/images/ai_movie_detective.jpg',
      '/images/ai_movie_hero.jpg',
    ],
    pointsReward: 20,
  },
  গান: {
    titles: [
      'রাতের ছাদে অ্যাকোস্টিক গান • ৩০ সেকেন্ডের সুরেলা কনসার্ট 🎵🎸',
      'বাউল ও পপ ফিউশন লাইভ স্টেজ • ধামাকা গানের রিল 🎵🔥',
      'নিয়ন স্টুডিও জ্যামিং • মিষ্টি গিটার ও গানের সুর 🎶💫',
      'জ্যোৎস্না রাতের মেঠো গান • হৃদয় জুড়ানো ৩০ সেকেন্ড 🌙🎤',
      'ঢাকা কনসার্ট নাইট ভাইবস • সুপারহিট বাংলা বিট ⚡🎸',
      'একতারা ও আধুনিক পপ রিমিক্স • মাসুদ রানার মিউজিক শো 🎼✨',
    ],
    captions: [
      'সুর, গিটার ও রঙিন লাইটিংয়ে ৩০ সেকেন্ডের মিউজিক্যাল রিল! সাউন্ড অন করে শুনুন 🎵🎧',
      'মন ভালো করার মতো অসাধারণ গানের সুর — মাসুদ রানার মিউজিক কালেকশন! 🎸✨',
      'গানটি ভালো লাগলে ডাবল ট্যাপ করে লাইক দিন ও বন্ধুদের শেয়ার করুন! ❤️🎶',
    ],
    hashtags: ['#গান', '#BanglaSong', '#Music30s', '#MasudRana', '#LiveConcert'],
    audioTracks: [
      'অ্যাকোস্টিক গিটার ও পপ মেলোডি (৩০ সেকেন্ড) - মাসুদ রানা',
      'বাউল ফিউশন কনসার্ট বিট - AI মিউজিক স্টুডিও',
      'সাউথ এশিয়ান অ্যাকোস্টিক রিমিক্স - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_song_concert.mp4',
      '/videos/ai_song_folk.mp4',
      '/videos/ai_trending_neon_music.mp4',
    ],
    images: [
      '/images/ai_song_concert.jpg',
      '/images/ai_song_folk.jpg',
      '/images/ai_trending_neon_music.jpg',
    ],
    pointsReward: 20,
  },
  বিনোদন: {
    titles: [
      'গান ও কমেডির ফিউশন ৩০ সেকেন্ডের বিনোদন শো 🌟🎶',
      'সুর, হাসি ও আড্ডায় জমজমাট এন্টারটেইনমেন্ট রিল (৩০ সেকেন্ড) 🌟😂',
      'উইকেন্ড ফান ও মিউজিক ধামাকা • মাসুদ রানার বিশেষ পরিবেশনা 🎉🔥',
      'রঙিন স্টেজ পারফরম্যান্স ও গানের তালে ৩০ সেকেন্ড 🎤✨',
      'রাতের শহরের বিনোদন ও আনন্দ উৎসব • নন-স্টপ রিলস 🌃🎶',
      'চায়ের কাপে আড্ডা, গান আর নির্মল হাসির ৩০ সেকেন্ড ☕🎵',
    ],
    captions: [
      'গানসহ ৩০ সেকেন্ডের সম্পূর্ণ বিনোদনমূলক ভিডিও! একটার পর একটা রিল অটো প্লে হবে 🌟🎶',
      'বিনোদন আর পয়েন্ট একসাথে — মাসুদ রানার স্পেশাল ৩০ সেকেন্ড এন্টারটেইনমেন্ট ফিড! ✨🔥',
      'হাসি, গান আর রঙিন ভিজ্যুয়ালের সেরা সংমিশ্রণ! 🎭🎵',
    ],
    hashtags: ['#বিনোদন', '#Entertainment30s', '#SongComedy', '#MasudRana', '#ReelPayBD'],
    audioTracks: [
      '৩০ সেকেন্ডের আপবিট গান ও বিনোদন বিট - মাসুদ রানা',
      'কনসার্ট ও কমেডি ফিউশন মিউজিক - AI স্টুডিও',
      'সুপার ফান মিউজিক্যাল রিদম - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_song_folk.mp4',
      '/videos/ai_comedian_stage.mp4',
      '/videos/ai_comedian_village.mp4',
      '/videos/ai_trending_dhaka.mp4',
      '/videos/ai_song_concert.mp4',
      '/videos/ai_trending_neon_music.mp4',
    ],
    images: [
      '/images/ai_song_folk.jpg',
      '/images/ai_comedian_stage.jpg',
      '/images/ai_comedian_village.jpg',
      '/images/ai_trending_dhaka.jpg',
      '/images/ai_song_concert.jpg',
      '/images/ai_trending_neon_music.jpg',
    ],
    pointsReward: 20,
  },
  ট্রেন্ডিং: {
    titles: [
      'ঢাকা হাতিরঝিল নাইট লাইটস ও সিনেম্যাটিক AI রিল ✨🌃',
      'মাসুদ রানার AI মিউজিক স্টুডিও ভাইরাল বিট রিমিক্স 🎸🔥',
      '৬০ সেকেন্ডে বিকাশ ও নগদ ইনস্ট্যান্ট ক্যাশআউট ট্রেন্ড ⚡💸',
      'ভাইরাল ক্রিয়েটর স্টার চ্যালেঞ্জ ও সুপার গিফট শো 🏆✨',
      '২০২৬-এর সেরা ট্রেন্ডিং AI ভিজ্যুয়াল আর্ট রিল 🚀🌟',
      'রাতের শহরের নিয়োন আলো ও চিল মিউজিক ভাইবস 🎶💫',
    ],
    captions: [
      'ট্রেন্ডিং AI ভিডিও ও ছবি মাসুদ রানার অফিসিয়াল ফিড থেকে! 🔥✨',
      'অবিরাম দেখতে থাকুন আর প্রতিটি রিল দেখে পয়েন্ট জিতুন! 💸🚀',
    ],
    hashtags: ['#ট্রেন্ডিং', '#ViralBD', '#MasudRana', '#ReelPayBD', '#AIReels'],
    audioTracks: [
      'মাসুদ রানা ভাইরাল স্টুডিও বিট',
      'ঢাকা নাইট ভাইবস - AI মিউজিক',
      'ট্রেন্ডিং রিলস সাউন্ড - Masud Rana',
    ],
    videos: [
      '/videos/ai_trending_dhaka.mp4',
      '/videos/ai_trending_neon_music.mp4',
      '/videos/reel_bkash_cashout.mp4',
      '/videos/reel_creator_star.mp4',
    ],
    images: [
      '/images/ai_trending_dhaka.jpg',
      '/images/ai_trending_neon_music.jpg',
      '/images/reel_bkash_cashout.jpg',
      '/images/reel_creator_star.jpg',
    ],
    pointsReward: 20,
  },
  গেমিং: {
    titles: [
      'ই-স্পোর্টস প্রো গেমিং ক্ল্যাচ ও সাইবারপাঙ্ক AI ব্যাটেল 🎮⚡',
      'ভিআর মেটাভার্স ফিউচার গেমিং ওয়ার্ল্ড ট্যুর 🕶️🔥',
      'লাইভ গেমিং স্ট্রিমে সুপার টাইগার ও ক্রাউন গিফট ধামাকা 🐯👑',
      'মোবাইল গেমিং এফপিএস বুস্ট ও প্রো সেটআপ গাইড 📱🎯',
    ],
    captions: [
      'গেমারদের জন্য মাসুদ রানার হাই-ভোল্টেজ AI গেমিং রিল! 🎮⚡',
      'প্রো গেমিং মুভ আর নিয়নের দুনিয়ায় স্বাগতম! 🔥🕹️',
    ],
    hashtags: ['#গেমিং', '#GamingBD', '#EsportsAI', '#MasudRana', '#ProGamer'],
    audioTracks: [
      'সাইবারপাঙ্ক ই-স্পোর্টস থিম - AI বিট',
      'হাই-এনার্জি গেমিং সাউন্ড - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_gaming_esports.mp4',
      '/videos/ai_gaming_vr.mp4',
      '/videos/reel_livestream_gift.mp4',
    ],
    images: [
      '/images/ai_gaming_esports.jpg',
      '/images/ai_gaming_vr.jpg',
      '/images/reel_livestream_gift.jpg',
    ],
    pointsReward: 15,
  },
  রান্না: {
    titles: [
      'পুরান ঢাকার শাহী কাচ্চি বিরিয়ানি সিক্রেট AI রেসিপি 🍲🔥',
      'ঝাল ঝাল দেশি ফুচকা ও চটপটি স্ট্রিট ফুড স্পেশাল 😋🌶️',
      'ঘরোয়া মশলায় ৫ মিনিটে মজাদার বিকেলের নাস্তা 🍳✨',
      'রাজকীয় বিরিয়ানির পারফেক্ট দম ও জাফরান টিপস 🍛👑',
    ],
    captions: [
      'দেখলেই জিভে জল চলে আসবে! মাসুদ রানার AI ফুড রিল 🍲😋',
      'দেশি খাবারের স্বাদ আর ঘ্রাণ এবার এআই ভিজ্যুয়ালে! ✨🍛',
    ],
    hashtags: ['#রান্না', '#BanglaFood', '#KacchiBiryani', '#Fuchka', '#MasudRana'],
    audioTracks: [
      'দেশি রান্নার সুর ও কিচেন অ্যাম্বিয়েন্স',
      'ফুড ভ্লগ স্পেশাল মিউজিক - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_cooking_biryani.mp4',
      '/videos/ai_cooking_streetfood.mp4',
    ],
    images: [
      '/images/ai_cooking_biryani.jpg',
      '/images/ai_cooking_streetfood.jpg',
    ],
    pointsReward: 15,
  },
  শিক্ষা: {
    titles: [
      'এআই ও কোডিং শিখে ঘরে বসে অনলাইন ক্যারিয়ার গাইড 💻🤖',
      'রিলস দেখে ও টাস্ক করে প্রতিদিন ইনকাম করার স্মার্ট গাইড 💸📚',
      'ডেইলি লগইন বোনাস ও স্ট্রিক পয়েন্ট ডাবল করার টেকনিক 🎁🧠',
      'স্মার্টফোনে ভিডিও এডিটিং ও AI কন্টেন্ট তৈরির সহজ উপায় 📱✨',
    ],
    captions: [
      'প্রতিদিন নতুন কিছু শিখুন মাসুদ রানার AI এডুকেশন সিরিজে! 📚✨',
      'প্রযুক্তি ও স্মার্ট আর্নিং-এর সহজ বাংলা গাইডলাইন 💡🚀',
    ],
    hashtags: ['#শিক্ষা', '#AILearning', '#TechBangla', '#MasudRana', '#SmartCareer'],
    audioTracks: [
      'AI টেক স্টাডি লো-ফাই বিট - মাসুদ রানা',
      'স্মার্ট লার্নিং ভয়েস ওভার ও মিউজিক',
    ],
    videos: [
      '/videos/ai_education_tech.mp4',
      '/videos/reel_taka_earn.mp4',
      '/videos/reel_daily_bonus.mp4',
    ],
    images: [
      '/images/ai_education_tech.jpg',
      '/images/reel_taka_earn.jpg',
      '/images/reel_daily_bonus.jpg',
    ],
    pointsReward: 20,
  },
};

const VISUAL_FILTERS = [
  undefined,
  'saturate(118%) contrast(106%)',
  'brightness(106%) saturate(124%)',
  'contrast(110%) hue-rotate(8deg)',
  'sepia(14%) saturate(122%) contrast(105%)',
  'brightness(104%) hue-rotate(-10deg) saturate(115%)',
];

const EXTRA_CATEGORY_IMAGES: Record<ContentCategory, string[]> = {
  কমেডি: [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=720&auto=format&fit=crop&q=80',
  ],
  'শর্ট ড্রামা': [
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=720&auto=format&fit=crop&q=80',
  ],
  'শর্ট মুভি': [
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=720&auto=format&fit=crop&q=80',
  ],
  গান: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=720&auto=format&fit=crop&q=80',
  ],
  বিনোদন: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=720&auto=format&fit=crop&q=80',
  ],
  ট্রেন্ডিং: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=720&auto=format&fit=crop&q=80',
  ],
  গেমিং: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=720&auto=format&fit=crop&q=80',
  ],
  রান্না: [
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=720&auto=format&fit=crop&q=80',
  ],
  শিক্ষা: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=720&auto=format&fit=crop&q=80',
  ],
};

// Cycle pattern emphasizing Comedy, Short Drama, Short Movie, Songs, and 30s Entertainment alongside all other categories
const STREAM_CATEGORY_CYCLE: ContentCategory[] = [
  'কমেডি',
  'শর্ট ড্রামা',
  'গান',
  'শর্ট মুভি',
  'বিনোদন',
  'কমেডি',
  'ট্রেন্ডিং',
  'গেমিং',
  'রান্না',
  'শিক্ষা',
];

/**
 * Generates an unlimited stream of unique 30-second AI Reels across Comedy, Short Drama, Short Movie,
 * Songs, Entertainment, and all categories — all owned by Masud Rana.
 */
export function generateUnlimitedAiReelsBatch(options: {
  startSequence: number;
  count?: number;
  category?: string;
  creator?: MasudRanaCreatorIdentity;
}): Reel[] {
  const {
    startSequence,
    count = 8,
    category = 'সকল',
    creator = DEFAULT_MASUD_CREATOR,
  } = options;

  const targetCategory: ContentCategory | null =
    category && ALL_CONTENT_CATEGORIES.includes(category as ContentCategory)
      ? (category as ContentCategory)
      : null;

  const generated: Reel[] = [];
  const baseTime = Date.parse('2026-11-22T12:00:00Z') - startSequence * 60000;

  for (let i = 0; i < count; i++) {
    const seq = startSequence + i;
    const cat: ContentCategory =
      targetCategory || STREAM_CATEGORY_CYCLE[seq % STREAM_CATEGORY_CYCLE.length];

    const tpl = AI_CATEGORY_TEMPLATES[cat];
    const titleBase = tpl.titles[seq % tpl.titles.length];
    const episodeNum = Math.floor(seq / tpl.titles.length) + 1;
    const title = episodeNum > 1 ? `${titleBase} • পর্ব ${episodeNum}` : titleBase;

    const allImages = [...tpl.images, ...(EXTRA_CATEGORY_IMAGES[cat] || [])];
    const thumbnailUrl = allImages[seq % allImages.length];

    // Use real 30-second musical MP4 videos 83% of the time + AI visual motion 17% of the time
    const isPhotoMotionReel = seq % 6 === 5;
    const videoUrl = isPhotoMotionReel ? '' : tpl.videos[seq % tpl.videos.length];
    const filter = VISUAL_FILTERS[seq % VISUAL_FILTERS.length];

    const createdAt = new Date(baseTime - i * 45000).toISOString();

    generated.push({
      id: `ai_reel_${seq}_${cat}`,
      userId: creator.id,
      title,
      creatorName: creator.name,
      creatorHandle: creator.handle,
      creatorAvatar: creator.avatar,
      isVerified: true,
      category: cat,
      thumbnailUrl,
      videoUrl,
      likesCount: 48 + ((seq * 17) % 450),
      commentsCount: 5 + ((seq * 5) % 52),
      sharesCount: 8 + ((seq * 9) % 70),
      viewsCount: 210 + ((seq * 53) % 2600),
      pointsReward: tpl.pointsReward,
      timeAgo: isPhotoMotionReel ? 'AI ভিজ্যুয়াল' : '৩০ সেকেন্ড ভিডিও',
      createdAt,
      audioTrack: tpl.audioTracks[seq % tpl.audioTracks.length],
      caption: tpl.captions[seq % tpl.captions.length],
      hashtags: tpl.hashtags,
      isEarningEnabled: true,
      isSpecialOffer: seq % 6 === 0,
      specialOfferBadge: seq % 6 === 0 ? '🎵 ৩০সে. স্পেশাল' : undefined,
      filter,
    });
  }

  return generated;
}
