export const BACKEND_URL = 'http://localhost:8000'
export const getUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}`
export const updateProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/profile`
export const searchUsersUrl = (query: string) => `${BACKEND_URL}/users/search?query=${encodeURIComponent(query)}`
export const getCollabProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/collab_profile`
export const updateCollabProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/collab_profile`
export const followUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/follow`
export const unfollowUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/unfollow`
export const interestUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/interest`
export const uninterestUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/uninterest`
export const mutualFollowersUrl = (userId: string, myId: string) =>
  `${BACKEND_URL}/users/${userId}/mutual_followers?my_id=${myId}`
export const followersUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/followers`
export const followingUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/following`
export const postsUrl = (feed: string, userId?: string) => {
  const params = new URLSearchParams({ feed })
  if (userId) params.append('user_id', userId)
  return `${BACKEND_URL}/posts?${params.toString()}`
}
export const createPostUrl = `${BACKEND_URL}/posts`
export const recommendedUsersUrl = `${BACKEND_URL}/recommended_users`
export const popularTagsUrl = `${BACKEND_URL}/popular_tags`
export const likePostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/like`
export const unlikePostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/unlike`
export const postLikersUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/likers`
export const postCommentsUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/comments`
export const bestAnswerUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/best_answer`
export const updatesWsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/updates'
export const bookmarkPostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/bookmark`
export const unbookmarkPostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/unbookmark`
export const userBookmarksUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/bookmarks`
export const retweetPostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/retweet`
export const unretweetPostUrl = (postId: number) => `${BACKEND_URL}/posts/${postId}/unretweet`
export const sendMessageUrl = `${BACKEND_URL}/messages`
export const messagesWithUrl = (userId: string, otherId: string) =>
  `${BACKEND_URL}/messages/${userId}/with/${otherId}`
export const notificationsUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/notifications`
export const reportPostUrl = (postId: number) => `${BACKEND_URL}/reports/post/${postId}`
export const reportCommentUrl = (commentId: number) => `${BACKEND_URL}/reports/comment/${commentId}`
export const trendingPostsUrl = `${BACKEND_URL}/trending_posts`
export const postsByTagUrl = (tag: string) =>
  `${BACKEND_URL}/posts/by_tag?tag=${encodeURIComponent(tag)}`
export const tutorialTasksUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/tutorial_tasks`
export const achievementsUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/achievements`
export const jobsUrl = `${BACKEND_URL}/jobs`
export const createGroupUrl = `${BACKEND_URL}/groups`
export const userGroupsUrl = (userId: string) => `${BACKEND_URL}/groups/${userId}`
export const groupMessagesUrl = (groupId: number) => `${BACKEND_URL}/groups/${groupId}/messages`
