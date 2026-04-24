import { User, Calendar, Share2, ImageIcon } from 'lucide-react'

export default function PostPreview({ post }) {
  if (!post) return null

  // Pastikan kita punya fallback jika data author tidak lengkap
  const authorName = post.author?.name || 'Unknown'
  const originalName = post.originalAuthor?.name || 'Original Author'

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

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
        {/* Caption (Main/Reposter Caption) */}
        {post.content ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        ) : (
          post.type !== 'repost' && <p className="text-sm text-slate-300 italic">Tidak ada caption.</p>
        )}

        {/* Nested Quote Tweet (Original Post) */}
        {post.type === 'repost' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mt-3">
            {/* Original Author Header */}
            <div className="p-3 bg-slate-50 flex items-center gap-3 border-b border-slate-100">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
                {post.originalAuthor?.avatar ? (
                  <img src={post.originalAuthor.avatar} alt={originalName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-primary-600">{originalName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{originalName}</p>
              </div>
            </div>
            
            {/* Original Caption */}
            {post.originalContent && (
              <div className="p-3">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.originalContent}</p>
              </div>
            )}
            
            {/* Original Media */}
            {post.image && (
              <div className="relative bg-slate-50 border-t border-slate-100">
                <img 
                  src={post.image} 
                  alt="Original content" 
                  className="w-full h-auto max-h-[400px] object-contain mx-auto"
                  loading="lazy"
                />
              </div>
            )}
            {!post.originalContent && !post.image && (
               <div className="p-4 text-center">
                 <p className="text-xs text-slate-400 italic">Data original post tidak ditemukan atau telah dihapus.</p>
               </div>
            )}
          </div>
        )}

        {/* Media / Image (For Original Posts) */}
        {post.type !== 'repost' && post.image && (
          <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto max-h-[500px] object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.01]"
              loading="lazy"
            />
          </div>
        )}
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
