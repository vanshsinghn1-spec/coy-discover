export interface Profile {
  id: number;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
  is_current?: number;
}

export interface SwipeRequest {
  profileId: number;
  action: 'like' | 'pass';
}

export interface SwipeResponse {
  success: boolean;
  action: 'like' | 'pass';
  matched: boolean;
  matchedProfile?: Profile | null;
}

export type TabType = 'home' | 'discover' | 'matches';
