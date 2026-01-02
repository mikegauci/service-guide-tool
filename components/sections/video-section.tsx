'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { VideoLibrary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, PlayCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface VideoSectionProps {
  vehicleId: string;
}

export default function VideoSection({ vehicleId }: VideoSectionProps) {
  const [videos, setVideos] = useState<VideoLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos();
  }, [vehicleId]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('category', { ascending: true });

      if (error) throw error;
      setVideos(data || []);

      const savedWatched = localStorage.getItem(`watched-videos-${vehicleId}`);
      if (savedWatched) {
        setWatchedVideos(new Set(JSON.parse(savedWatched)));
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatched = (videoId: string) => {
    const newWatched = new Set(watchedVideos);
    if (newWatched.has(videoId)) {
      newWatched.delete(videoId);
    } else {
      newWatched.add(videoId);
    }
    setWatchedVideos(newWatched);
    localStorage.setItem(`watched-videos-${vehicleId}`, JSON.stringify(Array.from(newWatched)));
  };

  const getFilteredVideos = () => {
    let filtered = videos;

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((v) => v.category === filterCategory);
    }

    return filtered;
  };

  const groupedVideos = getFilteredVideos().reduce(
    (acc, video) => {
      if (!acc[video.category]) {
        acc[video.category] = [];
      }
      acc[video.category].push(video);
      return acc;
    },
    {} as Record<string, VideoLibrary[]>
  );

  const categories = Object.keys(groupedVideos).sort();
  const watchedCount = watchedVideos.size;

  if (loading) {
    return <div className="text-white">Loading video library...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Video Tutorial Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-600 border-slate-500 text-white placeholder:text-slate-400"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-600 border border-slate-500 text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {videos.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-600 rounded-md p-3">
              <p className="text-white font-semibold">
                Watched: {watchedCount}/{videos.length} videos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-6 text-center text-slate-400">
            No videos found for this vehicle
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedVideos[category].map((video) => (
                <Card
                  key={video.id}
                  className={`border-slate-600 overflow-hidden ${
                    watchedVideos.has(video.id) ? 'bg-slate-700/50' : 'bg-slate-700'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-semibold flex-1 ${
                            watchedVideos.has(video.id)
                              ? 'text-slate-400 line-through'
                              : 'text-white'
                          }`}
                        >
                          {video.title}
                        </h4>
                        {watchedVideos.has(video.id) && (
                          <Badge variant="outline" className="text-xs">
                            Watched
                          </Badge>
                        )}
                      </div>
                      {video.description && (
                        <p className="text-xs text-slate-400">{video.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-600 text-slate-300"
                      >
                        {video.difficulty_level}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <a
                          href={video.youtube_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Watch
                        </a>
                      </Button>
                      <Button
                        onClick={() => toggleWatched(video.id)}
                        variant="outline"
                        size="sm"
                        className={`text-slate-300 border-slate-500 ${
                          watchedVideos.has(video.id)
                            ? 'bg-green-500/20 border-green-600 text-green-400'
                            : ''
                        }`}
                      >
                        {watchedVideos.has(video.id) ? 'Mark Unwatched' : 'Mark Watched'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
