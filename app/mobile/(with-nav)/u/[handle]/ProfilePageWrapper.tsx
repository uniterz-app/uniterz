'use client';

import dynamic from 'next/dynamic';

// ProfilePage をクライアントでのみ描画
const ProfilePage = dynamic(
  () => import('../../../../component/profile/ProfilePage'),
  { ssr: false }
);

export default function ProfilePageWrapper({ handle }: { handle: string }) {
  return <ProfilePage handle={handle} />;
}
