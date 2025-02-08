export interface User {
  id: string
  email: string
  avatar_url: string | null
  username: string | null
  posts?: Post[]
  bio: string | null
  user_metadata: {
    username: string
    avatar_url?: string
  }
}

export interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  created_at: string
  updated_at: string
  user: User
}

export interface Post {
  id: string
  content: string
  user_id: string
  created_at: string
  user: User
  likes: Like[]
  bookmarks: Bookmark[]
  comments: Comment[]
  likes_count: number
  bookmarks_count: number
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export type CommentsResponse = {
  comments: Comment[] | null
  error: string | null
}

// Add this new interface for the params
export interface PageParams {
  username: string
}

// Add this new type for the props of the ProfilePage component
export type ProfilePageProps = {
  params: PageParams
}

