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
  | 'ট্রেনিং'
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
  'ট্রেনিং',
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
      'কমেডিয়ান স্টেজ শো: মেসের ডাল ও বন্ধুর ট্রিট জোকস (বাংলা ভয়েস) 🎭😂',
      'গ্রামের চায়ের দোকানে চাচা-ভাতিজার বাকি খাওয়ার মজার কাণ্ড ☕🤣',
      'অনলাইন শপিং বনাম বাস্তবতা: ল্যাপটপ অর্ডার দিয়ে খেলনা পেলো! 📦😂',
      'বস যখন বিড়ালের চেহারায় মিটিং নেয়! অফিস কমেডি ডায়ালগ 😹💼',
      'ঢাকার রিকশায় বিশ ব্যাগের পাহাড় ও রিকশা মামার কথা 🛺🤣',
      'গলির ক্রিকেটে সুপারম্যান ক্যাচ ও আম্পায়ারের ঝগড়া! 🏏😂',
      'সেলুনে গিয়ে "একটু ছোট করে দেন" বলার ভয়াবহ ফলাফল! ✂️🤣',
    ],
    captions: [
      'আসল বাংলা সংলাপ, হাসির সাউন্ড ইফেক্ট ও ৩০ সেকেন্ডের কমেডি শো — মাসুদ রানার AI স্টুডিও থেকে! 😂🔥',
      'প্রতিদিন এমন ফানি বাংলা কমেডি নাটিকা দেখতে ফলো করে রাখুন! 🤣✨',
      'বন্ধুদের ট্যাগ করুন যাদের সাথে ঠিক এমন ঘটনা ঘটেছে! 🎭😂',
    ],
    hashtags: ['#কমেডি', '#BanglaComedy', '#MasudRana', '#ComedyShow', '#হাসিরভিডিও'],
    audioTracks: [
      'কমেডিয়ান স্টেজ সংলাপ ও হাসির রোল - মাসুদ রানা',
      'চা-আড্ডা ফানি বাংলা ডায়ালগ - মাসুদ রানা',
      'কমেডি শো সাউন্ডট্র্যাক - মাসুদ রানা',
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
      '/images/scene_comedy_mic.jpg',
      '/images/ai_comedian_village.jpg',
      '/images/scene_comedy_online.jpg',
      '/images/ai_comedy_cat_boss.jpg',
      '/images/ai_comedy_rickshaw.jpg',
      '/images/ai_comedy_cricket.jpg',
      '/images/scene_comedy_mess.jpg',
    ],
    pointsReward: 15,
  },
  'শর্ট ড্রামা': {
    titles: [
      'বৃষ্টির রাতে দেখা • আবেগঘন বাংলা শর্ট ড্রামা (সংলাপসহ) 🎬🌧️',
      'ক্যাম্পাসের শেষ বিকেল • বন্ধুত্ব ও বিদায়ের শর্ট নাটক 🎬✨',
      'বটতলার শেষ নোটবুক • ৩০ সেকেন্ডের রোমান্টিক শর্ট ড্রামা 💔🌧️',
      'অপেক্ষার প্রহর • ঢাকার বৃষ্টির সন্ধ্যায় পুনর্মিলন ☕❤️',
    ],
    captions: [
      'বাংলা সংলাপ, বাঁশির সুর ও বৃষ্টির আবহে ৩০ সেকেন্ডের শর্ট ড্রামা — মাসুদ রানার অফিসিয়াল ফিড! 🎬❤️',
      'দুজন চরিত্রের আবেগঘন কথোপকথন ও ৫টি দৃশ্যে সাজানো মিনি নাটক! ✨🌧️',
    ],
    hashtags: ['#শর্টড্রামা', '#BanglaDrama', '#MasudRana', '#30SecDrama', '#ReelPayBD'],
    audioTracks: [
      'বৃষ্টি ও বাঁশির সুরে বাংলা নাটক সংলাপ - মাসুদ রানা',
      'ক্যাম্পাস ইভিনিং ড্রামা স্কোর ও ডায়ালগ - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_drama_rain.mp4',
      '/videos/ai_drama_campus.mp4',
    ],
    images: [
      '/images/scene_drama_wait.jpg',
      '/images/scene_drama_campus_talk.jpg',
      '/images/scene_drama_reunion.jpg',
      '/images/ai_drama_campus.jpg',
    ],
    pointsReward: 20,
  },
  'শর্ট মুভি': {
    titles: [
      'অন্ধকার গলির রহস্য • থ্রিলার শর্ট মুভি (বাংলা ডায়ালগ) 🎥🕵️',
      'ব্রিজের ওপারে মিশন • অ্যাকশন ও সাসপেন্স শর্ট ফিল্ম 🎥🔥',
      'গোপন ফাইল নং ৭ • মধ্যরাতের ডিটেকটিভ মিনি সিনেমা 📞⚡',
      'শেষ ১৫ সেকেন্ড • রুদ্ধশ্বাস বাংলা শর্ট মুভি 📂🔥',
    ],
    captions: [
      'থ্রিলার মিউজিক ও চরিত্রের সংলাপসহ ৩০ সেকেন্ডের রোমাঞ্চকর শর্ট মুভি! 🎥⚡ মাসুদ রানা।',
      '৫টি সিনেম্যাটিক দৃশ্য ও সাসপেন্স ডায়ালগে তৈরি মিনি বাংলা ফিল্ম! 🕵️🔥',
    ],
    hashtags: ['#শর্টমুভি', '#ShortFilmBD', '#ThrillerMovie', '#MasudRana', '#Cinema30s'],
    audioTracks: [
      'থ্রিলার মুভি ব্যাকগ্রাউন্ড ও সংলাপ - মাসুদ রানা',
      'অ্যাকশন সাসপেন্স শর্ট ফিল্ম স্কোর - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_movie_detective.mp4',
      '/videos/ai_movie_hero.mp4',
    ],
    images: [
      '/images/scene_movie_clue.jpg',
      '/images/ai_movie_hero.jpg',
      '/images/scene_movie_shadow.jpg',
      '/images/ai_movie_detective.jpg',
    ],
    pointsReward: 20,
  },
  গান: {
    titles: [
      'ভালোবাসি ভালোবাসি • রাতের ছাদে লাইভ বাংলা গান 🎵🎸',
      'মানুষ গুরু নিষ্ঠা • বাংলার আসল বাউল কনসার্ট গান 🎵🔥',
      'ওরে ও দরিয়ার মাঝি • নজরুলগীতি ও লাইভ বাংলা গান 🎶🎤',
      'আহা আজি এ বসন্তে • ৩০ সেকেন্ডের সুরেলা বাংলা গান 🎶💫',
      'যদি তোর ডাক শুনে কেউ না আসে (একলা চলো রে) • বাংলা গান 🌙🎤',
      'মরার দেশে ভালো লাগে না • আসল বাংলা লোকসঙ্গীত 🎼✨',
    ],
    captions: [
      'আসল বাংলা কণ্ঠের গান, লাইভ কনসার্ট দৃশ্য ও মিউজিক ওয়েভফর্ম — সাউন্ড চালু করে শুনুন! 🎵🎧',
      'বাউল, নজরুলগীতি ও চিরসবুজ বাংলা গানের ৩০ সেকেন্ডের সেরা কালেকশন! 🎸✨',
    ],
    hashtags: ['#গান', '#BanglaSong', '#BaulSong', '#MasudRana', '#LiveConcert'],
    audioTracks: [
      'ভালোবাসি ভালোবাসি (আসল বাংলা গান)',
      'মানুষ গুরু নিষ্ঠা (বাউল লোকগান)',
      'ওরে ও দরিয়ার মাঝি (নজরুলগীতি)',
      'আহা আজি এ বসন্তে (বাংলা গান)',
      'একলা চলো রে (বাংলা কণ্ঠ)',
    ],
    videos: [
      '/videos/ai_song_concert.mp4',
      '/videos/ai_song_folk.mp4',
      '/videos/ai_song_majhi.mp4',
      '/videos/ai_trending_neon_music.mp4',
      '/videos/ai_trending_dhaka.mp4',
      '/videos/ai_ent_morar.mp4',
    ],
    images: [
      '/images/scene_song_singer.jpg',
      '/images/scene_song_baul.jpg',
      '/images/ai_trending_neon_music.jpg',
      '/images/ai_trending_dhaka.jpg',
      '/images/ai_song_folk.jpg',
      '/images/ai_song_concert.jpg',
    ],
    pointsReward: 20,
  },
  বিনোদন: {
    titles: [
      'মরার দেশে ভালো লাগে না • আসল বাংলা গান ও বিনোদন 🌟🎶',
      'আমার প্রভাত মধুর হলো • ৩০ সেকেন্ডের আনন্দময় গান ও বিনোদন 🌟🎸',
      'ওরে ও দরিয়ার মাঝি • লাইভ স্টেজ বাংলা গান ও বিনোদন 🎤✨',
      'কমেডিয়ান স্টেজ শো ও দর্শকের হাসির রোল (৩০ সেকেন্ড) 🎭😂',
      'বাউল ও লোকসঙ্গীত কনসার্ট ধামাকা (৩০ সেকেন্ড) 🎉🔥',
      'আহা আজি এ বসন্তে • রঙিন মিউজিক্যাল বিনোদন রিল 🎤✨',
    ],
    captions: [
      'আসল বাংলা গান ও জমজমাট কমেডি সংলাপে ভরপুর ৩০ সেকেন্ডের বিনোদন ভিডিও! 🌟🎶',
      'একটার পর একটা ভিডিও নিজে থেকেই প্লে হবে — দেখতে থাকুন ও পয়েন্ট জিতুন! ✨🔥',
    ],
    hashtags: ['#বিনোদন', '#BanglaSong', '#ComedyShow', '#MasudRana', '#ReelPayBD'],
    audioTracks: [
      'মরার দেশে ভালো লাগে না (বাংলা লোকগান)',
      'আমার প্রভাত মধুর হলো (বাংলা গান)',
      'ওরে ও দরিয়ার মাঝি (বাংলা কণ্ঠ)',
      'কমেডিয়ান স্টেজ শো (বাংলা ডায়ালগ)',
    ],
    videos: [
      '/videos/ai_ent_morar.mp4',
      '/videos/ai_ent_prabhat.mp4',
      '/videos/ai_song_majhi.mp4',
      '/videos/ai_comedian_stage.mp4',
      '/videos/ai_song_folk.mp4',
      '/videos/ai_trending_neon_music.mp4',
      '/videos/ai_comedian_village.mp4',
    ],
    images: [
      '/images/scene_song_baul.jpg',
      '/images/scene_song_singer.jpg',
      '/images/scene_comedy_mic.jpg',
      '/images/ai_song_folk.jpg',
      '/images/ai_trending_neon_music.jpg',
      '/images/scene_comedy_friends.jpg',
    ],
    pointsReward: 20,
  },
  ট্রেনিং: {
    titles: [
      'সকালের ফিটনেস ও জিম ওয়ার্কআউট ট্রেনিং গাইড 💪🏃‍♂️',
      'ফ্রিল্যান্সিং ও ভিডিও এডিটিং প্রো স্কিল ট্রেনিং 💻🎬',
      'ক্রিকেট ব্যাটিং ও ফাস্ট বোলিং প্রো ট্রেনিং টিপস 🏏⚡',
      'মোবাইল ভিডিওগ্রাফি ও ভাইরাল রিলস মেকিং ট্রেনিং 📱🎥',
    ],
    captions: [
      'কোনো স্থির ছবি নয়—১০০% চলমান বাস্তব ভিডিওতে স্টেপ বাই স্টেপ ট্রেনিং গাইড! 🏋️🔥',
      'প্রতিদিন মাত্র ২০ মিনিট প্র্যাকটিসে নিজের ফিটনেস ও স্কিল বাড়ান! 💪✨',
    ],
    hashtags: ['#ট্রেনিং', '#TrainingBD', '#FitnessTraining', '#SkillDev', '#MasudRana'],
    audioTracks: [
      'ফিটনেস ও ওয়ার্কআউট কোচ বাংলা ভয়েস - মাসুদ রানা',
      'ফ্রিল্যান্সিং ও ভিডিও এডিটিং ট্রেনিং গাইড - মাসুদ রানা',
      'ক্রিকেট কোচিং প্রো টিপস ও বাংলা সংলাপ',
      'স্মার্টফোন ভিডিওগ্রাফি ট্রেনিং গাইড',
    ],
    videos: [
      '/videos/ai_training_fitness.mp4',
      '/videos/ai_training_freelance.mp4',
      '/videos/ai_training_cricket.mp4',
      '/videos/ai_training_camera.mp4',
    ],
    images: [
      '/images/ai_education_tech.jpg',
      '/images/ai_comedy_cricket.jpg',
      '/images/reel_creator_star.jpg',
    ],
    pointsReward: 20,
  },
  ট্রেন্ডিং: {
    titles: [
      'যদি তোর ডাক শুনে কেউ না আসে (একলা চলো রে) • লাইভ বাংলা গান 🌙🎤',
      'আহা আজি এ বসন্তে • ৩০ সেকেন্ডের সুরেলা কনসার্ট ভিডিও 🎶💫',
      'সকালের ফিটনেস ও ওয়ার্কআউট চ্যালেঞ্জ ট্রেনিং 💪🔥',
      'মোবাইল ভিডিওগ্রাফি ও রিলস মেকিং প্রো ট্রেনিং 📱🎬',
      '৬০ সেকেন্ডে বিকাশ ও নগদ ইনস্ট্যান্ট ক্যাশআউট ⚡💸',
      'ভাইরাল ক্রিয়েটর স্টার চ্যালেঞ্জ ও সুপার গিফট শো 🏆✨',
    ],
    captions: [
      '১০০% চলমান বাস্তব ভিডিও ও আসল বাংলা গান — মাসুদ রানার অফিসিয়াল ফিড থেকে! 🔥🎬',
      'অবিরাম দেখতে থাকুন আর প্রতিটি রিল দেখে পয়েন্ট জিতুন! 💸🚀',
    ],
    hashtags: ['#ট্রেন্ডিং', '#ViralBD', '#MasudRana', '#ReelPayBD', '#LiveVideo'],
    audioTracks: [
      'একলা চলো রে (আসল বাংলা কণ্ঠ) - মাসুদ রানা',
      'আহা আজি এ বসন্তে (লাইভ কনসার্ট বাংলা গান)',
      'ফিটনেস ও ক্রিয়েটর ট্রেনিং বাংলা ভয়েস - মাসুদ রানা',
    ],
    videos: [
      '/videos/ai_trending_dhaka.mp4',
      '/videos/ai_trending_neon_music.mp4',
      '/videos/ai_training_fitness.mp4',
      '/videos/ai_training_camera.mp4',
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
      '/videos/ai_training_freelance.mp4',
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
  ট্রেনিং: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=720&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=720&auto=format&fit=crop&q=80',
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

// Cycle pattern emphasizing Comedy, Short Drama, Short Movie, Training, Songs, and 30s Entertainment alongside all other categories
const STREAM_CATEGORY_CYCLE: ContentCategory[] = [
  'কমেডি',
  'ট্রেনিং',
  'শর্ট ড্রামা',
  'গান',
  'শর্ট মুভি',
  'বিনোদন',
  'কমেডি',
  'ট্রেন্ডিং',
  'ট্রেনিং',
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

    // Always use real 30-second multi-scene MP4 videos with Bengali dialogue/songs
    const videoUrl = tpl.videos[seq % tpl.videos.length];
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
      timeAgo: '৩০ সেকেন্ড ভিডিও',
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
