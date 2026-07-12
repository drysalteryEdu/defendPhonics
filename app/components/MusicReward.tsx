'use client'
import { useState, useEffect } from 'react'
import type { Song } from '../data/songs'

interface Props {
  song: Song
  onClaim: () => void  // 领取回血 +3 并恢复游戏
}

export default function MusicReward({ song, onClaim }: Props) {
  const [iframeOk, setIframeOk]     = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)

  // 5s 超时：若 iframe 未加载则自动显示歌词备用界面
  useEffect(() => {
    const t = setTimeout(() => {
      if (!iframeOk) setShowLyrics(true)
    }, 5000)
    return () => clearTimeout(t)
  }, [iframeOk])

  const embedUrl = `https://embed.music.apple.com/us/album/${song.collectionId}?i=${song.trackId}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="relative bg-gradient-to-b from-pink-600 to-purple-800 rounded-3xl p-5 shadow-2xl w-full max-w-sm"
        style={{ animation: 'slideDown 0.4s ease-out' }}
      >
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-14 h-14 rounded-2xl shadow-lg shrink-0"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <p className="text-[10px] text-pink-200 uppercase tracking-wider font-bold">🎵 困境激励时间</p>
            <h2 className="text-white font-black text-sm leading-tight mt-0.5">{song.title}</h2>
            <p className="text-pink-300 text-[11px] mt-0.5">听首儿歌充个电，奖励等你拿！</p>
          </div>
        </div>

        {/* Apple Music iframe（尝试加载） */}
        {!showLyrics && (
          <div className="rounded-2xl overflow-hidden bg-black/30 mb-1">
            <iframe
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              frameBorder="0"
              height="152"
              style={{ width: '100%', overflow: 'hidden', background: 'transparent' }}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
              src={embedUrl}
              onLoad={() => setIframeOk(true)}
            />
          </div>
        )}

        {/* 歌词备用（iframe 加载失败时或手动切换） */}
        {showLyrics && (
          <div className="bg-white/10 rounded-2xl p-4 mb-2 max-h-44 overflow-y-auto">
            <pre className="text-pink-100 text-[13px] leading-relaxed font-sans whitespace-pre-wrap">
              {song.lyrics}
            </pre>
          </div>
        )}

        {/* 切换按钮 */}
        <button
          onClick={() => setShowLyrics(v => !v)}
          className="block mx-auto text-pink-300 hover:text-pink-100 text-[11px] mb-3 transition-colors"
        >
          {showLyrics ? '▶ 尝试播放音乐' : '📖 查看歌词'}
        </button>

        {/* 领取奖励 */}
        <button
          onClick={onClaim}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-900 font-black text-base py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          🎁 领取回血 +3，继续战斗！
        </button>
      </div>
    </div>
  )
}
