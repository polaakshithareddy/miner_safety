import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/axiosConfig';

const SafetyShortsProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [myShorts, setMyShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const [profileRes, shortsRes] = await Promise.all([
          api.get(`/social/profile/${user._id}`),
          api.get('/safety-shorts/me'),
        ]);
        setProfile(profileRes.data);
        setMyShorts(shortsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?._id]);

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />

        <div className="relative px-4 pt-4 flex items-center justify-between">
          <Link
            to="/safety-shorts"
            className="p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 transition"
          >
            <span className="sr-only">Back to safety shorts</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-semibold text-white tracking-wide uppercase">My Safety Profile</h1>
          <Link
            to="/safety-shorts/create"
            className="p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 transition flex items-center justify-center"
          >
            <span className="sr-only">Create safety short</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          </Link>
        </div>

        <div className="relative px-4 pt-6 pb-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-900 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
            {getInitials(profile?.name || user?.name || 'U')}
          </div>
          <h2 className="mt-3 text-lg font-bold text-white text-center">
            {profile?.name || user?.name}
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            {profile?.operationRole || user?.operationRole || user?.role}
          </p>
        </div>

        <div className="px-6 pb-3">
          <div className="grid grid-cols-3 gap-2 text-center text-white text-sm">
            <div>
              <p className="font-bold">{myShorts.length}</p>
              <p className="text-[11px] text-gray-400">Posts</p>
            </div>
            <div>
              <p className="font-bold">{profile?.followersCount ?? 0}</p>
              <p className="text-[11px] text-gray-400">Followers</p>
            </div>
            <div>
              <p className="font-bold">{profile?.followingCount ?? 0}</p>
              <p className="text-[11px] text-gray-400">Following</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-300">My Safety Shorts</p>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && !loading && (
            <p className="text-xs text-red-400 py-3">{error}</p>
          )}
          {!loading && !error && myShorts.length === 0 && (
            <p className="text-xs text-gray-400 py-4 text-center">
              You have not posted any safety shorts yet.
            </p>
          )}

          {!loading && !error && myShorts.length > 0 && (
            <div className="grid grid-cols-3 gap-1 pb-4">
              {myShorts.map((short) => (
                <motion.div
                  key={short._id}
                  whileTap={{ scale: 0.96 }}
                  className="relative aspect-[9/16] bg-gray-800 rounded-md overflow-hidden"
                >
                  {short.thumbnailUrl ? (
                    <img
                      src={short.thumbnailUrl}
                      alt={short.caption || 'Safety short'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 px-1 text-center">
                      {short.caption || 'Safety short'}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent flex items-end px-1 pb-0.5">
                    <p className="text-[9px] text-white truncate">
                      {short.category?.toUpperCase() || 'SAFETY'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyShortsProfile;
