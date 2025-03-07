import { createClient } from "@/utils/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/sidebar";
import { Post } from "@/components/post";
import { FollowButton } from "@/components/follow-button";
import { getFollowerCount, getFollowingCount, getFollowingStatus } from "@/actions/user-actions";
import type { User } from "@/lib/types";
import { AvatarUploadOverlay } from "@/components/avatar-upload-overlay";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`
      *,
      posts (
        id,
        content,
        user_id,
        created_at,
        last_updated,
        user:users!posts_user_id_fkey (id, username, avatar_url)
      )
    `)
    .eq("username", username)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user:", userError);
    notFound();
  }

  const user = userData as User;
  const isOwnProfile = session?.user?.id === user.id;

  const posts = (user.posts || []).map((post) => ({
    id: post.id,
    content: post.content,
    user_id: post.user_id,
    created_at: post.created_at,
    user: {
      id: post.user?.id || post.user_id,
      username: post.user?.username || user.username,
      avatar_url: post.user?.avatar_url || user.avatar_url,
    },
  }));

  const [followersCount, followingCount, followingStatus] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
    session?.user ? getFollowingStatus(user.id) : Promise.resolve({ isFollowing: false }),
  ]);

  const timestamp = Date.now();
  const avatarUrlWithCache = user.avatar_url ? `${user.avatar_url}?t=${timestamp}` : null;

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block lg:w-[300px] lg:shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-xl bg-white shadow p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                {/* Left Column: Avatar and Info */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className="relative h-24 w-24">
                    <div className="h-24 w-24 rounded-full overflow-hidden">
                      {avatarUrlWithCache ? (
                        <Image
                          src={avatarUrlWithCache || "/placeholder.svg"}
                          alt={`${user.username || "User"}'s avatar`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-700 font-medium text-2xl">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{user.username || "Anonymous"}</h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {user.bio || "No bio available"}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm sm:text-base text-gray-700">
                      <span>{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
                      <span>{followersCount} follower{followersCount !== 1 ? "s" : ""}</span>
                      <span>{followingCount} following</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Upload Overlay (only for owner) */}
                {isOwnProfile && (
                  <div className="mt-4 sm:mt-0">
                    <AvatarUploadOverlay />
                  </div>
                )}

                {!isOwnProfile && session?.user && (
                  <FollowButton userId={user.id} initialIsFollowing={followingStatus.isFollowing} />
                )}
              </div>
            </div>
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post.id} post={post} />)
              ) : (
                <div className="rounded-xl bg-white shadow p-6 text-center">
                  <p className="text-gray-500">No posts yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}