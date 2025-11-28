'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { ThemeProvider, css, Global } from '@emotion/react';
import { BarChartHorizontal, Trophy, Coins, Target } from "lucide-react";
import { Montserrat } from 'next/font/google';
import { storage } from "@/lib/firebase";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import ProfileEditSheet from "./ProfileEditSheet";

const montNum = Montserrat({
  subsets: ['latin'],
  weight: ['800'],
});

// ===== デフォルトプロフィール =====
// ★ 修正：デフォルトの avatarUrl を空に（Unsplash の画像は消す）
const BASE_PROFILE = {
  avatarUrl: "",
  displayName: 'Chiki',
  handle: '@chiki',
  bio: 'NBAとBリーグの試合分析が好き。Next.jsで対戦カードUIを開発中。ランは週5で3km！aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  counts: { posts: 128, followers: 2450, following: 311 },
  isSelf: false,
  isFollowing: false,
  badges: [
    { id: 'b1', label: '100 Bets', tier: 'bronze' },
    { id: 'b2', label: 'ROI > 10%', tier: 'silver' },
    { id: 'b3', label: 'Streak 7W', tier: 'gold' },
    { id: 'b4', label: 'Top Analyst', tier: 'legend' },
  ],
} as const;

type Summary = { winRate: number; roi: number; units: number; avgOdds: number };
const mockSummaryByRange: Record<'7d' | '30d' | 'all', Summary> = {
  '7d': { winRate: 0.58, roi: 0.12, units: 4.6, avgOdds: 1.95 },
  '30d': { winRate: 0.55, roi: 0.08, units: 12.3, avgOdds: 2.02 },
  all: { winRate: 0.57, roi: 0.1, units: 143.2, avgOdds: 1.98 },
};

const theme = {
  colors: { bg: '#0a3b47', text: '#EDEDF2', primary: '#6EA8FE', outline: 'rgba(255,255,255,.08)', card: '#12444D' },
} as const;

type Props = { handle: string };

export default function ProfilePage({ handle }: Props) {
  const [isFollowing, setIsFollowing] = useState<boolean>(BASE_PROFILE.isFollowing);
  const [tab, setTab] = useState<'overview' | 'stats'>('overview');
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [user, setUser] = useState<{
    displayName: string;
    handle: string;
    bio?: string;
    photoURL?: string;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches;

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoadingUser(true);
        setUserError(null);
        const h = decodeURIComponent(handle);
        const qref = query(
          collection(db, "users"),
          where("handle", "==", h),
          limit(1)
        );
        const snap = await getDocs(qref);
        if (!cancelled) {
          if (!snap.empty) {
            const data = snap.docs[0].data() as {
              displayName: string; handle: string; bio?: string; photoURL?: string;
            };
            setUser({
              displayName: data.displayName ?? "",
              handle: data.handle ?? h,
              bio: data.bio ?? "",
              photoURL: data.photoURL ?? "",
            });
            setUserError(null);
          }
        }
      } catch (e: any) {
        if (!cancelled) setUserError(e.message ?? "failed to load user");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    fetchUser();
    return () => { cancelled = true; };
  }, [handle]);

  const toggleFollow = () => setIsFollowing((v) => !v);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const profile = useMemo(() => {
    const u = user ?? null;
    return {
      ...BASE_PROFILE,
      displayName: u?.displayName ?? handle,
      handle: `@${u?.handle ?? handle}`,
      avatarUrl:
        u?.photoURL && u.photoURL.trim() !== '' ? u.photoURL : "",
      bio: u?.bio ?? "",
      isFollowing,
    };
  }, [user, handle, isFollowing]);

  const summary = useMemo(() => mockSummaryByRange[range], [range]);

  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <Global
        styles={css`
          body {
            margin: 0;
            background: ${theme.colors.bg};
            color: ${theme.colors.text};
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP,
              sans-serif;
          }
        `}
      />
      <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        {/* ヘッダー */}
        <div
          style={{
            background: theme.colors.card,
            border: '1px solid ' + theme.colors.outline,
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            padding: 20,
            marginBottom: 24,
            position: 'relative',
          }}
        >
          <button
            onClick={openEdit}
            style={{
              position: 'absolute',
              top: isMobile ? 30 : 20,
              right: 12,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,.15)',
              background: 'rgb(230, 171, 253)',
              color: '#0B0B0D',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            編集
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '96px 1fr',
              columnGap: 32,
              alignItems: 'start',
            }}
          >
            {/* ▼▼▼ 修正済みアバター：中身は画像だけ ▼▼▼ */}
            <div
              style={{
                width: 'clamp(64px, 18vw, 110px)',
                height: 'clamp(64px, 18vw, 110px)',
                marginTop: 10,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #0f2d35',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.1)',
                background: '#000', // ← デフォルト黒背景
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.displayName}のアイコン`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : null}
            </div>

            {/* ▲▲▲ ここまで修正済みアバター ▲▲▲ */}

            {/* ユーザー名など */}
            <div>
              <h1
                style={{
                  margin: '8px 0 0',
                  fontSize: 'clamp(22px, 8vw, 44px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                }}
              >
                {profile.displayName}
              </h1>

              <p style={{ margin: 0, opacity: 0.7 }}>{profile.handle}</p>
              <p style={{ marginTop: 8 }}>{profile.bio}</p>

              {/* カウント */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 8,
                  flexWrap: isMobile ? 'nowrap' : 'wrap',
                }}
              >
                {[
                  { label: 'フォロワー', value: profile.counts.followers },
                  { label: 'フォロー中', value: profile.counts.following },
                ].map((item) => (
                  <span
                    key={item.label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(255,255,255,.08)',
                      padding: '6px 10px',
                      borderRadius: 999,
                      fontSize: 13,
                    }}
                  >
                    <strong style={{ color: '#EDEDF2', marginRight: 6 }}>
                      {item.value}
                    </strong>
                    {item.label}
                  </span>
                ))}
              </div>

              {/* フォローボタン */}
              <button
                onClick={toggleFollow}
                style={{
                  marginTop: 12,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,.15)',
                  fontSize: 'clamp(12px, 3.4vw, 14px)',
                  background: 'rgb(229, 255, 58)',
                  color: '#0B0B0D',
                  fontWeight: 700,
                  fontFamily: 'Impact, sans-serif',
                  boxShadow:
                    '0 -1px 0 rgba(255,255,255,.2) inset, 0 2px 4px rgba(0,0,0,0.15)',
                }}
              >
                {isFollowing ? 'Following' : '+Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* タブ */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            padding: '8px 0',
            background: theme.colors.bg,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {(['overview', 'stats'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 18px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 10,
                  border:
                    tab === t
                      ? '1px solid #6EA8FE'
                      : '1px solid ' + theme.colors.outline,
                  background:
                    tab === t ? 'rgba(110,168,254,0.1)' : 'transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '10px 18px',
                  fontSize: 15,
                  borderRadius: 8,
                  border:
                    range === r
                      ? '1px solid #6EA8FE'
                      : '1px solid ' + theme.colors.outline,
                  background: 'transparent',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <StatCard label="分析数" value={profile.counts.posts} icon={<BarChartHorizontal />} compact={isMobile} />
              <StatCard label="勝率" value={`${Math.round(summary.winRate * 100)}%`} icon={<Trophy />} compact={isMobile} />
              <StatCard label="獲得ユニット" value={summary.units.toFixed(1)} icon={<Coins />} compact={isMobile} />
              <StatCard label="平均オッズ" value={summary.avgOdds.toFixed(2)} icon={<Target />} compact={isMobile} />
            </div>

            <h3 style={{ margin: '16px 0' }}>バッジ / 実績</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.badges.map((b) => (
                <span
                  key={b.id}
                  style={{
                    border: '1px solid ' + theme.colors.outline,
                    padding: '6px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    opacity: 0.9,
                  }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === 'stats' && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: '16px 0' }}>Stats（準備中）</h3>
            <p>期間: {range}</p>
          </div>
        )}
      </div>

      {isEditOpen && (
        <ProfileEditSheet
          draftName={profile.displayName}
          setDraftName={() => {}}
          draftBio={profile.bio}
          setDraftBio={() => {}}
          initialPhotoURL={user?.photoURL ?? undefined}
          onClose={closeEdit}
          onSaved={() => closeEdit()}
        />
      )}
    </ThemeProvider>
  );
}

/* ===== 小さなカード（サマリー用） ===== */
type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  compact?: boolean;
};

function StatCard({ label, value, icon, compact = false }: StatCardProps) {
  const pad = compact ? 10 : 18;
  const valueFont = compact ? 20 : 25;
  const labelFont = compact ? 12 : 14;
  const iconSize = compact ? 16 : 18;

  const iconEl =
  React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: iconSize })
    : icon;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12,
        padding: pad,
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
        }}
      >
        {iconEl}
        <div style={{ fontSize: labelFont, fontWeight: 600, opacity: 0.85 }}>
          {label}
        </div>
      </div>

      <div
        className={montNum.className}
        style={{
          fontSize: valueFont,
          fontWeight: 800,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
