import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promotion' | 'update' | 'warning';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface InstructionalVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  category: 'setup' | 'gameplay' | 'maintenance' | 'tips';
  isWatched: boolean;
}

export interface PhotoGalleryItem {
  id: string;
  imageUrl: string;
  caption?: string;
  category: 'gameplay' | 'events' | 'products' | 'community';
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface HomeState {
  announcements: Announcement[];
  videos: InstructionalVideo[];
  photos: PhotoGalleryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: string | null;
}

interface HomeActions {
  fetchDashboardData: () => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  markAnnouncementAsRead: (announcementId: string) => void;
  markVideoAsWatched: (videoId: string) => void;
  likePhoto: (photoId: string) => Promise<void>;
  unlikePhoto: (photoId: string) => Promise<void>;
  clearError: () => void;
}

type HomeStore = HomeState & HomeActions;

// Mock data
const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'New Neon Colors Available!',
    message: 'Check out our latest collection of vibrant neon colors for your Nite Putter cups.',
    type: 'promotion',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    imageUrl: 'https://via.placeholder.com/300x150/00FF88/000000?text=Neon+Colors',
    actionUrl: '/shop',
    actionText: 'Shop Now',
  },
  {
    id: 'ann-2',
    title: 'App Update v2.1.0',
    message: 'New features: Custom presets, improved BLE connectivity, and enhanced animations.',
    type: 'update',
    isRead: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: 'ann-3',
    title: 'Weekend Tournament',
    message: 'Join our virtual night golf tournament this weekend! Prizes for top 3 players.',
    type: 'info',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    expiresAt: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
  },
];

const mockVideos: InstructionalVideo[] = [
  {
    id: 'vid-1',
    title: 'Getting Started with Nite Putter',
    description: 'Learn how to set up your cups and connect them to the app.',
    thumbnailUrl: 'https://via.placeholder.com/300x200/00D4FF/000000?text=Setup+Guide',
    videoUrl: 'https://example.com/video1.mp4',
    duration: 180, // 3 minutes
    category: 'setup',
    isWatched: false,
  },
  {
    id: 'vid-2',
    title: 'Advanced Color Modes',
    description: 'Discover all the different lighting modes and how to create custom presets.',
    thumbnailUrl: 'https://via.placeholder.com/300x200/B347FF/000000?text=Color+Modes',
    videoUrl: 'https://example.com/video2.mp4',
    duration: 240, // 4 minutes
    category: 'tips',
    isWatched: true,
  },
  {
    id: 'vid-3',
    title: 'Night Golf Rules & Tips',
    description: 'Master the art of night golf with these pro tips and official rules.',
    thumbnailUrl: 'https://via.placeholder.com/300x200/FF47B3/000000?text=Golf+Tips',
    videoUrl: 'https://example.com/video3.mp4',
    duration: 360, // 6 minutes
    category: 'gameplay',
    isWatched: false,
  },
];

const mockPhotos: PhotoGalleryItem[] = [
  {
    id: 'photo-1',
    imageUrl: 'https://via.placeholder.com/400x300/00FF88/000000?text=Night+Golf+1',
    caption: 'Amazing night golf session with friends!',
    category: 'gameplay',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 24,
    isLiked: false,
  },
  {
    id: 'photo-2',
    imageUrl: 'https://via.placeholder.com/400x300/00D4FF/000000?text=Tournament',
    caption: 'Last weekend\'s tournament was incredible!',
    category: 'events',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    likes: 42,
    isLiked: true,
  },
  {
    id: 'photo-3',
    imageUrl: 'https://via.placeholder.com/400x300/B347FF/000000?text=New+Cups',
    caption: 'Check out the new cup designs!',
    category: 'products',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    likes: 18,
    isLiked: false,
  },
];

export const useHomeStore = create<HomeStore>()(
  persist(
    (set, _get) => ({
      // State
      announcements: mockAnnouncements,
      videos: mockVideos,
      photos: mockPhotos,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastRefresh: null,

      // Actions
      fetchDashboardData: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          set({
            announcements: mockAnnouncements,
            videos: mockVideos,
            photos: mockPhotos,
            isLoading: false,
            lastRefresh: new Date().toISOString(),
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to load dashboard data',
          });
        }
      },

      refreshDashboardData: async () => {
        set({ isRefreshing: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            announcements: mockAnnouncements,
            videos: mockVideos,
            photos: mockPhotos,
            isRefreshing: false,
            lastRefresh: new Date().toISOString(),
          });
        } catch (error) {
          set({
            isRefreshing: false,
            error: 'Failed to refresh dashboard data',
          });
        }
      },

      markAnnouncementAsRead: (announcementId: string) => {
        set(state => ({
          announcements: state.announcements.map(announcement =>
            announcement.id === announcementId
              ? { ...announcement, isRead: true }
              : announcement
          ),
        }));
      },

      markVideoAsWatched: (videoId: string) => {
        set(state => ({
          videos: state.videos.map(video =>
            video.id === videoId
              ? { ...video, isWatched: true }
              : video
          ),
        }));
      },

      likePhoto: async (photoId: string) => {
        try {
          // Optimistic update
          set(state => ({
            photos: state.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, isLiked: true, likes: photo.likes + 1 }
                : photo
            ),
          }));

          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Revert optimistic update on error
          set(state => ({
            photos: state.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, isLiked: false, likes: photo.likes - 1 }
                : photo
            ),
            error: 'Failed to like photo',
          }));
        }
      },

      unlikePhoto: async (photoId: string) => {
        try {
          // Optimistic update
          set(state => ({
            photos: state.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, isLiked: false, likes: photo.likes - 1 }
                : photo
            ),
          }));

          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          // Revert optimistic update on error
          set(state => ({
            photos: state.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, isLiked: true, likes: photo.likes + 1 }
                : photo
            ),
            error: 'Failed to unlike photo',
          }));
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'home-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        announcements: state.announcements,
        videos: state.videos,
        photos: state.photos,
        lastRefresh: state.lastRefresh,
      }),
    }
  )
);