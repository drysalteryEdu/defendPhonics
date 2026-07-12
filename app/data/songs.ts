// Super Simple Songs — Apple Music 30s 试听 embed
// 嵌入格式：https://embed.music.apple.com/us/album/{collectionId}?i={trackId}

export interface Song {
  id: number
  title: string
  collectionId: number
  trackId: number
  coverUrl: string
  lyrics: string  // iframe 无法访问时的歌词备用显示
}

export const SONGS: Song[] = [
  {
    id: 1548676601,
    title: 'Old MacDonald Had a Farm',
    collectionId: 1548676600,
    trackId: 1548676601,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/c8/e7/ca/c8e7ca30-af5c-f4d3-0143-c022723fffb3/093624884385.jpg/100x100bb.jpg',
    lyrics: `🐄 Old MacDonald had a farm, E-I-E-I-O!
And on his farm he had a cow, E-I-E-I-O!
With a moo moo here and a moo moo there,
Here a moo, there a moo, everywhere a moo moo!
Old MacDonald had a farm, E-I-E-I-O! 🐖

🐥 ...had a chick, E-I-E-I-O!
With a cluck cluck here and a cluck cluck there...`,
  },
  {
    id: 1530539995,
    title: "If You're Happy and You Know It",
    collectionId: 1530539704,
    trackId: 1530539995,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/38/9f/09/389f0965-2f8d-212d-0e4b-de951e45344a/093624888703.jpg/100x100bb.jpg',
    lyrics: `😊 If you're happy and you know it, clap your hands! 👏👏
If you're happy and you know it, clap your hands! 👏👏
If you're happy and you know it,
Then your face will surely show it,
If you're happy and you know it, clap your hands! 👏👏

😄 ...stomp your feet! 👣👣
😄 ...shout hooray! 🎉`,
  },
  {
    id: 1869750953,
    title: 'Skidamarink',
    collectionId: 1869750952,
    trackId: 1869750953,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/a7/f3/82a7f331-f68b-c684-f841-1badf0fb1140/603497805365.jpg/100x100bb.jpg',
    lyrics: `💛 Skidamarink a dink a dink,
Skidamarink a doo,
I love you! ❤️

Skidamarink a dink a dink,
Skidamarink a doo,
I love you!

I love you in the morning ☀️
And in the afternoon 🌤️
I love you in the evening 🌙
And underneath the moon 🌕

Skidamarink a dink a dink,
Skidamarink a doo,
I LOVE YOU! 💕`,
  },
  {
    id: 1537397780,
    title: 'Head Shoulders Knees & Toes',
    collectionId: 1537397068,
    trackId: 1537397780,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/97/e2/6d/97e26dda-ed91-cd40-9de3-3fc06a7b05d5/851107005173.jpg/100x100bb.jpg',
    lyrics: `🤸 Head, shoulders, knees and toes,
Knees and toes!
Head, shoulders, knees and toes,
Knees and toes!

And eyes 👀 and ears 👂
And mouth 👄 and nose 👃

Head, shoulders, knees and toes,
Knees and toes! 🎵

(Try singing faster each time!)`,
  },
  {
    id: 1537567715,
    title: 'Baby Shark',
    collectionId: 1537567714,
    trackId: 1537567715,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/d7/7e/0b/d77e0b5f-c1e7-19b0-cf16-7d64da0c2277/851107005302.jpg/100x100bb.jpg',
    lyrics: `🦈 Baby shark, doo doo doo doo doo doo!
Baby shark, doo doo doo doo doo doo!
Baby shark! 🐟

Mommy shark, doo doo doo doo doo doo!
Mommy shark! 🦈

Daddy shark, doo doo doo doo doo doo!
Daddy shark! 🦈🦈

Grandma shark, doo doo doo doo doo doo!
Grandma shark! 👵🦈

Run away, doo doo doo doo doo doo!
Run away! 🏃

Safe at last! ✅🎉`,
  },
  {
    id: 1537404236,
    title: 'The Itsy Bitsy Spider',
    collectionId: 1537404229,
    trackId: 1537404236,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/69/ba/d0/69bad0e2-1a69-5a3c-8e54-11eae2e78661/851107005197.jpg/100x100bb.jpg',
    lyrics: `🕷️ The itsy bitsy spider
Climbed up the water spout. ⬆️
Down came the rain 🌧️
And washed the spider out. ⬇️

Out came the sun ☀️
And dried up all the rain.
And the itsy bitsy spider
Climbed up the spout again! 🕷️⬆️

(The big fat spider...
The teensy weensy spider...)`,
  },
]

export function pickRandomSong(excludeId = -1): Song {
  const pool = SONGS.filter(s => s.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}
