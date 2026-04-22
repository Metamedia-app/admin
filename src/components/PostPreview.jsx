import { User, Calendar, Share2, ImageIcon } from 'lucide-react'

export default function PostPreview({ post }) {
  if (!post) return null

  // Pastikan kita punya fallback jika data author tidak lengkap
  const authorName = post.author?.name || 'Unknown'
  const originalName = post.originalAuthor?.name || 'Original Author'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Repost Indicator */}
      {post.type === 'repost' && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <Share2 size={12} className="text-amber-600" />
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Reposted from <span className="underline">{originalName}</span>
          </span>
        </div>
      )}

      {/* Author Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center border border-slate-100 shadow-sm flex-shrink-0">
            {post.author?.avatar ? (
              <img 
                src={post.author.avatar} 
                alt={authorName} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-primary-600">${post.author?.initials || 'UN'}</span>`; }}
              />
            ) : (
              <span className="text-xs font-bold text-primary-600">{post.author?.initials || 'UN'}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{authorName}</p>
            <p className="text-[10px] text-slate-400 font-medium">NIM: {post.author?.nim || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
          <Calendar size={12} />
          <span className="text-[10px] font-medium">{post.date}</span>
        </div>
      </div>

      {/* Post Content Area */}
      <div className="p-5 space-y-4">
        {/* Caption */}
        {post.content ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        ) : (
          <p className="text-sm text-slate-300 italic">Tidak ada caption.</p>
        )}

        {/* Media / Image - HARUS TAMPIL JIKA ADA */}
        {post.image ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto max-h-[500px] object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="py-16 flex flex-col items-center gap-2 text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                    <span class="text-xs font-medium">Gambar tidak dapat dimuat</span>
                  </div>
                `;
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Stats Footer */}
      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">{post.raw?.likes_count || 0}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Likes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">{post.raw?.comments_count || 0}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Comments</span>
        </div>
        
        <div className="ml-auto">
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm border ${
            post.type === 'repost' 
              ? 'bg-amber-100 text-amber-700 border-amber-200' 
              : 'bg-primary-100 text-primary-700 border-primary-200'
          }`}>
            {post.type}
          </span>
        </div>
      </div>
    </div>
  )
}
