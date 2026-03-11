import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/axiosConfig';

const SafetyShortsCreate = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('ppe');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl.trim()) {
      setError('Please paste a YouTube link');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/safety-shorts', {
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        caption: caption.trim() || undefined,
        category,
      });
      navigate('/safety-shorts');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create safety short');
    } finally {
      setSubmitting(false);
    }
  };

  const CategoryButton = ({ value, label, icon }) => (
    <button
      type="button"
      onClick={() => setCategory(value)}
      className={`flex flex-col items-center justify-center flex-1 px-3 py-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-400 transition-all
        ${category === value ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-800 text-gray-100 border-gray-700'}`}
    >
      <span className="text-2xl mb-1" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 relative overflow-hidden">
        {/* Top gradient strip */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link
            to="/safety-shorts"
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
          >
            <span className="sr-only">Back to safety shorts</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Create</p>
            <h1 className="text-lg font-bold text-white">Safety Short</h1>
          </div>

          <Link
            to="/safety-shorts/profile"
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
          >
            <span className="sr-only">Go to my profile</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 16a6 6 0 1112 0H2z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-5 pt-1 space-y-4">
          {/* Source selector - for now only YouTube is active */}
          <div className="bg-gray-800/80 rounded-2xl p-3 flex items-center gap-3 border border-gray-700">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600/80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 15l5.19-3L10 9v6z" />
                <path fillRule="evenodd" d="M4.624 5.204A2.25 2.25 0 016.64 3.75h10.72a2.25 2.25 0 012.016 1.454c.35.94.624 2.37.624 4.296v1c0 1.927-.273 3.356-.624 4.296a2.25 2.25 0 01-2.016 1.454H6.64a2.25 2.25 0 01-2.016-1.454C4.273 13.856 4 12.427 4 10.5v-1c0-1.927.273-3.356.624-4.296z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">YouTube link</p>
              <p className="text-[11px] text-gray-400">Paste a 15–30 sec safety video link</p>
            </div>
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Video link</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/shorts/..."
              className="w-full rounded-xl bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Optional thumbnail URL */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Thumbnail (optional)</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Image link for preview"
              className="w-full rounded-xl bg-gray-900 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Category (icon driven) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-300">Safety topic</p>
            <div className="flex gap-2">
              <CategoryButton value="ppe" label="PPE" icon="" />
              <CategoryButton value="hazards" label="Hazard" icon="⚠️" />
              <CategoryButton value="equipment" label="Vehicle" icon="🚜" />
              <CategoryButton value="emergency" label="Fire" icon="🔥" />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-300">Short message (optional)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Example: Always wear your helmet when entering the mine."
              className="w-full rounded-xl bg-gray-900 border border-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
            />
            <p className="text-[10px] text-gray-500 text-right">{caption.length}/200</p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: submitting ? 1 : 0.97 }}
            className={`w-full mt-1 mb-1 inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold shadow-lg transition-colors
              ${submitting ? 'bg-gray-600 text-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400'}`}
          >
            {submitting ? (
              <span>Posting...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.25A1 1 0 009 15.75V11a1 1 0 112 0v4.75a1 1 0 00.725.962l5 1.25a1 1 0 001.169-1.409l-7-14z" />
                </svg>
                Post Safety Short
              </>
            )}
          </motion.button>

          <p className="text-[10px] text-gray-500 text-center pb-1 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
              <path d="M7 13a3 3 0 006 0H7z" />
            </svg>
            Only safety-related videos are allowed.
          </p>
        </form>
      </div>
    </div>
  );
};

export default SafetyShortsCreate;
