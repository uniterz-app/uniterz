// app/component/result/ResultCard.tsx
"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import { resultCardFlyoutButtonClasses } from "@/lib/ui/cyberMenuButton";
import { normalizeLeague } from "@/lib/leagues";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { ResultPlatform } from "@/lib/result/result-platform";
import type { PkScore } from "@/lib/games/pkScore";
import { normalizeNbaTopScorerPick } from "@/lib/nba/topScorer";
import { useNbaTopScorerCandidates } from "@/lib/nba/useNbaTopScorerCandidates";
import { MOBILE_RESULT_CARD_OUTER_CLASS } from "@/lib/games/mobileListCardLayout";
import { buildResultCardFaceModel } from "@/lib/result/buildResultCardFace";
import type { GameMarketRates } from "@/lib/games/fetchGameMarkets";
import ResultCardDesignFace from "@/app/component/result/ResultCardDesignFace";
import {
  isResultPostLiveGame,
  isResultPostMatchStarted,
} from "@/lib/result/resultLiveGame";
import { useResultCardClockMs } from "@/lib/hooks/useResultCardClockMs";

export type ResultCardOpenAnchor = { clientX: number; clientY: number };

type Props = {
  post: PredictionPostV2;
  href?: string;
  /** 一覧オーバーレイ用：タップ位置付近に詳細を出すため座標を渡す */
  onOpen?: (post: PredictionPostV2, anchor: ResultCardOpenAnchor) => void;
  language?: Language;
  /** 指定時は pathname ではなくこれでモバイル表示を決める（リザルトのルート固定用） */
  platform?: ResultPlatform;
  /** @deprecated WC 専用レイアウト削除後は未使用（呼び出し互換のため残す） */
  scheduleDense?: boolean;
  /**
   * 一覧が1件だけのとき true。下部の評価バーがビューポート判定で動かないのを避ける
   * @deprecated DesignFace 移行後は未使用（呼び出し互換のため残す）
   */
  ratingBarsImmediate?: boolean;
  /** 試合キックオフ前のみ true：右上に一覧から除外する操作を出す */
  showPreKickoffDismiss?: boolean;
  /** 一覧から除外（サーバー削除含む場合あり）。キックオフ後は呼ばれない想定 */
  onPreKickoffDismiss?: () => void | Promise<void>;
  /** 閲覧者 UID（自分の投稿と一致するときのみ右上に予想修正ボタン） */
  viewerUid?: string | null;
  /** 予想画面へのルート接頭辞（例: `/web`） */
  gamesRoutePrefix?: "/web" | "/mobile";
  /** 指定時は「予想を修正」でページ遷移せずコールバック（オーバーレイ等） */
  onRequestPredictEdit?: (post: PredictionPostV2) => void;
  /** キックオフ・LIVE 判定の基準時刻（一覧の定期 tick と揃える） */
  cardClockMs?: number;
  /** 予想オーバーレイ等：一覧遷移なしの埋め込み（リフト・クリック無効） */
  embedded?: boolean;
  /** 他人プロフィール向け：ガラス blur 等の重い演出を抑える */
  visualEffectsLite?: boolean;
  /** @deprecated DesignFace 移行後は未使用 */
  showFrameSweep?: boolean;
  /** @deprecated DesignFace 移行後は未使用（呼び出し互換のため残す） */
  pkScore?: PkScore | null;
  /** 線枠パス描画の開始遅延（秒）。一覧スロットと同期 */
  lineFrameDrawDelaySec?: number;
  /** games.marketBias / market 補完（新カード面の市場偏り） */
  gameMarket?: GameMarketRates | null;
  /** games.roundLabel / playoffRound 補完（旧投稿の MATCH 落ち向け） */
  gameRoundMeta?: {
    roundLabel?: string | null;
    playoffRound?: string | null;
    seasonRound?: string | number | null;
    seasonPhase?: string | null;
  } | null;
};

/** Router に繋がない環境（CSS3D の別ルート等）でも同じ UI を出す用 */
export type ResultCardPresentationProps = Props & {
  isMobile: boolean;
  onNavigate?: (href: string) => void;
  /** @deprecated DesignFace 移行後は未使用（呼び出し互換のため残す） */
  listDateLabel?: string;
};

function ResultCardPresentationImpl({
  post,
  href,
  onOpen,
  language = "ja",
  isMobile,
  onNavigate,
  showPreKickoffDismiss = false,
  onPreKickoffDismiss,
  viewerUid = null,
  gamesRoutePrefix,
  onRequestPredictEdit,
  cardClockMs,
  embedded = false,
  visualEffectsLite = false,
  lineFrameDrawDelaySec = 0,
  gameMarket = null,
  gameRoundMeta = null,
}: ResultCardPresentationProps) {
  const clock = useResultCardClockMs(cardClockMs);
  const m = t(language);
  const normalizedLeague = normalizeLeague(post.league);

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onOpen) {
      onOpen(post, { clientX: e.clientX, clientY: e.clientY });
    } else if (href && onNavigate) {
      onNavigate(href);
    }
  };

  const isLiveGame = isResultPostLiveGame(post, clock);

  const isOwnerPredict = Boolean(
    viewerUid && post.authorUid === viewerUid && post.gameId
  );

  const predictEditHref = useMemo(() => {
    if (!isOwnerPredict || !gamesRoutePrefix) return null;
    /** 試合確定後は修正 URL を組み立てない（導線は出さない） */
    const finalized =
      post.status === "final" || post.game?.status === "final";
    if (finalized) return null;
    return `${gamesRoutePrefix}/games/${post.gameId}/predict?edit=1`;
  }, [isOwnerPredict, gamesRoutePrefix, post.gameId, post.status, post.game?.status]);

  const hasCornerTrash = Boolean(showPreKickoffDismiss && onPreKickoffDismiss);
  const isPredictionFinalized =
    post.status === "final" || post.game?.status === "final";
  const hasCornerEdit = Boolean(
    isOwnerPredict &&
      !isPredictionFinalized &&
      (onRequestPredictEdit || (predictEditHref && onNavigate))
  );
  const isMatchStarted = isResultPostMatchStarted(post, clock);

  const hasCornerActions =
    !isMatchStarted &&
    !isPredictionFinalized &&
    (hasCornerEdit || hasCornerTrash);

  const showCornerControl = hasCornerActions;

  /** モバイルはホバーが使えないため、ハンバーガーでメニュー開閉 */
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const cornerFabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMatchStarted) setCornerFabOpen(false);
  }, [isMatchStarted]);

  useEffect(() => {
    if (!cornerFabOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      const el = cornerFabRef.current;
      if (el && !el.contains(e.target as Node)) setCornerFabOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [cornerFabOpen]);

  /** タップで開閉。カード hover でもサブメニューを出す */
  const flyoutTrashClass = cornerFabOpen
    ? "pointer-events-auto visible -translate-x-1/2 translate-y-0 opacity-100"
    : "pointer-events-none invisible -translate-x-1/2 -translate-y-2 opacity-0 group-hover/card:pointer-events-auto group-hover/card:visible group-hover/card:-translate-x-1/2 group-hover/card:translate-y-0 group-hover/card:opacity-100";

  const flyoutPenClass = cornerFabOpen
    ? "pointer-events-auto visible -translate-y-1/2 translate-x-0 opacity-100"
    : "pointer-events-none invisible -translate-y-1/2 translate-x-2 opacity-0 group-hover/card:pointer-events-auto group-hover/card:visible group-hover/card:translate-x-0 group-hover/card:opacity-100";

  const nbaScorerPick = useMemo(
    () =>
      normalizedLeague === "nba"
        ? normalizeNbaTopScorerPick(post.prediction?.goalScorer)
        : null,
    [normalizedLeague, post.prediction]
  );
  const needScorerNames = Boolean(nbaScorerPick && !nbaScorerPick.name);
  const { candidates: topScorerCandidates } = useNbaTopScorerCandidates({
    homeTeamId: post.home?.teamId,
    awayTeamId: post.away?.teamId,
    enabled: needScorerNames,
  });

  const faceModel = useMemo(
    () =>
      buildResultCardFaceModel(
        { ...(post as unknown as Record<string, unknown>), id: post.id },
        {
          ...(gameMarket
            ? {
                market: {
                  homeRate: gameMarket.homeRate,
                  awayRate: gameMarket.awayRate,
                },
              }
            : {}),
          ...(gameRoundMeta ? { gameMeta: gameRoundMeta } : {}),
          ...(topScorerCandidates.length > 0
            ? { topScorerCandidates }
            : {}),
        }
      ),
    [post, gameMarket, gameRoundMeta, topScorerCandidates]
  );

  const cornerMenu = showCornerControl ? (
    <div
      ref={cornerFabRef}
      data-capture-skip
      className={[
        /* ホバーでペンへ移る途中でも閉じにくいようホットエリアを広げる（見た目位置は維持） */
        "pointer-events-auto absolute",
        /* MatchListLineFrame は topLabel 用に pt-3.5 / marginTop:14 があり、枠上辺はその下。
           top は「枠オフセット 14 + 枠内 inset」で指定しないと枠線に乗る */
        isMobile
          ? "-m-3 p-3 right-2.5 top-7 z-[50]"
          : "-m-5 p-5 right-2.5 top-7 z-40 sm:right-3 sm:top-8",
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={[
          "relative flex items-center justify-center",
          isMobile ? "touch-manipulation" : "",
        ].join(" ")}
      >
        {/* 左に飛び出す：予想修正（ペン） */}
        {hasCornerEdit ? (
          <button
            type="button"
            className={[
              "absolute right-full top-1/2 mr-1.5 flex -translate-y-1/2 items-center justify-center transition-all duration-300 ease-out",
              resultCardFlyoutButtonClasses(isMobile, "edit"),
              isMobile ? "z-[55]" : "z-30",
              isMobile ? "touch-manipulation" : "",
              flyoutPenClass,
            ].join(" ")}
            aria-label={m.results.editPredictionAriaLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCornerFabOpen(false);
              if (onRequestPredictEdit) {
                onRequestPredictEdit(post);
              } else if (predictEditHref) {
                onNavigate?.(predictEditHref);
              }
            }}
          >
            <Pencil className="h-3 w-3" strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
        {/* 下に飛び出す：一覧から除外（ゴミ箱） */}
        {hasCornerTrash && onPreKickoffDismiss ? (
          <button
            type="button"
            className={[
              "absolute top-full left-1/2 mt-1.5 flex items-center justify-center transition-all duration-300 ease-out",
              resultCardFlyoutButtonClasses(isMobile, "delete"),
              isMobile ? "z-[55]" : "z-30",
              isMobile ? "touch-manipulation" : "",
              flyoutTrashClass,
            ].join(" ")}
            aria-label={m.results.removeFromList}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCornerFabOpen(false);
              void onPreKickoffDismiss();
            }}
          >
            <Trash2 className="h-3 w-3" strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
        {/* メイン：ハンバーガー（サイバー角パネル） */}
        <CyberMenuButton
          size="xs"
          className={[
            "cyber-menu-btn--white relative size-[26px] transition-all duration-300 ease-out",
            isMobile ? "z-[52]" : "z-20",
          ].join(" ")}
          aria-expanded={cornerFabOpen}
          aria-haspopup="true"
          aria-label={m.results.openActions}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCornerFabOpen((v) => !v);
          }}
        />
      </div>
    </div>
  ) : null;

  return (
    <div
      className={[
        embedded
          ? "w-full overflow-visible"
          : isMobile
            ? `${MOBILE_RESULT_CARD_OUTER_CLASS} overflow-visible`
            : "mx-auto w-full max-w-[1200px] overflow-visible",
        "group/card relative",
      ].join(" ")}
    >
      {cornerMenu}
      <ResultCardDesignFace
        language={language}
        face={faceModel}
        showDetailTab={!embedded}
        animateDraw={!visualEffectsLite}
        drawDelaySec={lineFrameDrawDelaySec}
        onOpen={embedded ? undefined : handle}
        live={isLiveGame}
      />
    </div>
  );
}

export const ResultCardPresentation = memo(ResultCardPresentationImpl);
ResultCardPresentation.displayName = "ResultCardPresentation";

export default function ResultCard(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const onNavigate = useCallback(
    (href: string) => {
      void router.push(href);
    },
    [router]
  );
  const isMobile =
    props.platform !== undefined
      ? props.platform === "mobile"
      : pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");
  const { platform, ...rest } = props;
  return (
    <ResultCardPresentation
      {...rest}
      platform={platform}
      isMobile={isMobile}
      onNavigate={onNavigate}
    />
  );
}
