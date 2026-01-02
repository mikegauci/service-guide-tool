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

  const getYouTubeThumbnail = (youtubeLink: string) => {
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    try {
      const url = new URL(youtubeLink);
      
      // Format: https://www.youtube.com/watch?v=VIDEO_ID
      if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
        videoId = url.searchParams.get('v') || '';
      }
      // Format: https://youtu.be/VIDEO_ID
      else if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
      }
      // Format: https://www.youtube.com/embed/VIDEO_ID
      else if (url.pathname.includes('/embed/')) {
        videoId = url.pathname.split('/embed/')[1];
      }
    } catch (e) {
      console.error('Invalid YouTube URL:', e);
      return null;
    }

    if (!videoId) return null;
    
    // Return YouTube thumbnail URL (high quality)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Video Tutorial Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted border-border text-white placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-muted border border-border text-white rounded-md px-3 py-2 text-sm"
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
            <div className="bg-btn-blue/10 border border-btn-blue/50 rounded-md p-3">
              <p className="text-white font-semibold">
                Watched: {watchedCount}/{videos.length} videos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No videos found for this vehicle
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedVideos[category].map((video) => {
                const thumbnail = getYouTubeThumbnail(video.youtube_link);
                
                return (
                <Card
                  key={video.id}
                  className={`border-border overflow-hidden ${
                    watchedVideos.has(video.id) ? 'bg-card/50' : 'bg-card'
                  }`}
                >
                  {thumbnail && (
                    <a
                      href={video.youtube_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full aspect-video bg-black overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className={`w-full h-full object-cover ${
                          watchedVideos.has(video.id) ? 'opacity-50' : ''
                        }`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                        <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </div>
                    </a>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className={`font-semibold flex-1 ${
                            watchedVideos.has(video.id)
                              ? 'text-muted-foreground line-through'
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
                        <p className="text-xs text-muted-foreground">{video.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-muted text-foreground"
                      >
                        {video.difficulty_level}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-btn-blue hover:bg-btn-blue/80 text-btn-blue-foreground"
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
                        className={`border-border ${
                          watchedVideos.has(video.id)
                            ? 'bg-btn-green/20 border-btn-green/50 text-btn-green'
                            : 'text-foreground'
                        }`}
                      >
                        {watchedVideos.has(video.id) ? 'Mark Unwatched' : 'Mark Watched'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
