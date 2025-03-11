import type { Database } from "@/types/database.types"

// Base types from Supabase database
export type UserRow = Database["public"]["Tables"]["users"]["Row"]
export type PostRow = Database["public"]["Tables"]["posts"]["Row"]
export type FollowRow = Database["public"]["Tables"]["follows"]["Row"]
export type ProfilePictureRow = Database["public"]["Tables"]["profile_pictures"]["Row"]

// Extended User type with additional properties
export interface User extends UserRow {
  posts?: Post[]
  user_metadata?: {
    username: string
    avatar_url?: string
  }
}

// Extended Post type with additional properties
export interface Post extends PostRow {
  user?: User
  likes?: Like[]
  bookmarks?: Bookmark[]
  comments?: Comment[]
  likes_count?: number
  bookmarks_count?: number
  image_url?: string // Added this property

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

export interface FollowResponse {
  success: boolean
  isFollowing: boolean
  followersCount: number
}

export interface MemorialPage {
  id: string
  name: string
  deceased_name: string
  birth_date: string | null
  death_date: string | null
  description: string | null
  avatar_url: string | null
  created_at: string
  user_id: string
  unique_identifier: string
  relationship_to_deceased: string | null
}

// Export the ProfilePicture type for use with the new table
export type ProfilePicture = ProfilePictureRow

